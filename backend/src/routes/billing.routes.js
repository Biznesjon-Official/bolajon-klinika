import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { withCache, bust } from '../utils/routeCache.js';
import Joi from 'joi';
import Invoice from '../models/Invoice.js';
import BillingItem from '../models/BillingItem.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Transaction from '../models/Transaction.js';
import Patient from '../models/Patient.js';
import Staff from '../models/Staff.js';
import LabTest from '../models/LabTest.js';
import DoctorService from '../models/DoctorService.js';
import AmbulatorProcedure from '../models/AmbulatorProcedure.js';
import AmbulatorRoom from '../models/AmbulatorRoom.js';
import Bed from '../models/Bed.js';
import mongoose from 'mongoose';

const router = express.Router();

// DEBUG: Check current user role
router.get('/debug/me',
  authenticate,
  async (req, res) => {
    res.json({
      success: true,
      user: req.user,
      message: 'This is your current user info'
    });
  }
);

// Validation schemas
const createInvoiceSchema = Joi.object({
  patient_id: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      service_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).default(1)
    })
  ).min(1).required(),
  payment_method: Joi.string().valid('cash', 'click', 'humo', 'uzcard').allow(null),
  paid_amount: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  doctor_id: Joi.string().allow(null),
  room_id: Joi.string().allow(null),
  bed_number: Joi.number().integer().min(1).allow(null)
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().valid('cash', 'click', 'humo', 'uzcard').required(),
  reference_number: Joi.string().allow('', null),
  notes: Joi.string().allow('', null)
});

/**
 * Get billing statistics
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'receptionist'),
  withCache('billing:stats', 60),
  async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Today's revenue
      const todayRevenue = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: today },
            transaction_type: 'payment'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Today's revenue by payment method
      const todayByMethod = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: today },
            transaction_type: 'payment'
          }
        },
        {
          $group: {
            _id: '$payment_method',
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Pending invoices count
      const pendingInvoices = await Invoice.countDocuments({
        payment_status: { $in: ['pending', 'partial'] }
      });

      // Total debt
      const totalDebtResult = await Invoice.aggregate([
        {
          $match: {
            payment_status: { $in: ['pending', 'partial'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $subtract: ['$total_amount', '$paid_amount'] } }
          }
        }
      ]);

      // This month's revenue
      const monthRevenue = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: startOfMonth },
            transaction_type: 'payment'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Month's revenue by payment method
      const monthByMethod = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: startOfMonth },
            transaction_type: 'payment'
          }
        },
        {
          $group: {
            _id: '$payment_method',
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Today's revenue by doctor (from invoices with metadata.doctor_id)
      const todayByDoctor = await Invoice.aggregate([
        {
          $match: {
            created_at: { $gte: today },
            payment_status: { $in: ['paid', 'partial'] }
          }
        },
        {
          $group: {
            _id: '$metadata.doctor_id',
            total: { $sum: '$paid_amount' },
            lab: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: '$items', as: 'i', cond: { $eq: ['$$i.item_type', 'laboratory'] } } } }, 0] },
                  '$paid_amount', 0
                ]
              }
            },
            procedure: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $filter: { input: '$items', as: 'i', cond: { $ne: ['$$i.item_type', 'laboratory'] } } } }, 0] },
                  '$paid_amount', 0
                ]
              }
            },
            doctor_name: { $first: '$metadata.doctor_name' }
          }
        },
        {
          $lookup: {
            from: 'staff',
            localField: '_id',
            foreignField: '_id',
            as: 'staff'
          }
        },
        {
          $project: {
            doctor_id: '$_id',
            doctor_name: {
              $cond: [
                { $gt: [{ $size: '$staff' }, 0] },
                { $concat: [{ $arrayElemAt: ['$staff.first_name', 0] }, ' ', { $arrayElemAt: ['$staff.last_name', 0] }] },
                { $ifNull: ['$doctor_name', 'Noma\'lum'] }
              ]
            },
            total: 1,
            lab: 1,
            procedure: 1
          }
        },
        { $sort: { total: -1 } }
      ])

      // Today's revenue by direction (item_type)
      const todayByDirection = await Invoice.aggregate([
        {
          $match: {
            created_at: { $gte: today },
            payment_status: { $in: ['paid', 'partial'] }
          }
        },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: { $ifNull: ['$items.item_type', 'other'] },
            total: { $sum: '$items.total_price' }
          }
        },
        { $sort: { total: -1 } }
      ])

      // Format payment method breakdown
      const formatMethodBreakdown = (rows) => {
        const breakdown = {
          cash: 0,
          click: 0,
          humo: 0,
          uzcard: 0
        };
        rows.forEach(row => {
          if (row._id) breakdown[row._id] = (breakdown[row._id] || 0) + row.total;
        });
        return breakdown;
      };

      res.json({
        success: true,
        data: {
          todayRevenue: todayRevenue[0]?.total || 0,
          todayByMethod: formatMethodBreakdown(todayByMethod),
          todayByDirection,
          todayByDoctor,
          pendingInvoices: pendingInvoices,
          totalDebt: totalDebtResult[0]?.total || 0,
          monthRevenue: monthRevenue[0]?.total || 0,
          monthByMethod: formatMethodBreakdown(monthByMethod)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get revenue report (alias)
 */
router.get('/revenue',
  authenticate,
  async (req, res, next) => {
    try {
      const { period } = req.query;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filter = { transaction_type: 'payment' };
      if (period === 'today') {
        filter.created_at = { $gte: today };
      } else if (period === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        filter.created_at = { $gte: startOfMonth };
      }

      const result = await Transaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          total: result[0]?.total || 0,
          count: result[0]?.count || 0,
          period: period || 'all'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get service categories (alias)
 */
router.get('/service-categories',
  authenticate,
  withCache('billing:service-categories', 300),
  async (req, res, next) => {
    try {
      const categories = await ServiceCategory.find().sort({ name: 1 });
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get service categories
 */
router.get('/services/categories',
  authenticate,
  async (req, res, next) => {
    try {
      const categories = await ServiceCategory.find().sort({ name: 1 });
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get all services
 */
router.get('/services',
  authenticate,
  withCache('billing:services', 300),
  async (req, res, next) => {
    try {
      const { category, is_active } = req.query;
      
      const filter = {};
      
      if (category) {
        filter.category = category;
      }
      
      if (is_active !== undefined) {
        filter.is_active = is_active === 'true';
      }
      
      const services = await Service.find(filter).sort({ category: 1, name: 1 });
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Create new invoice
 */
router.post('/invoices',
  authenticate,
  authorize('admin', 'receptionist'),
  async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
      const { error } = createInvoiceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      await session.startTransaction();

      const { patient_id, items, payment_method, paid_amount, discount_amount, notes, doctor_id, room_id, bed_number } = req.body;

      // Get patient to check last visit
      const patient = await Patient.findById(patient_id);
      if (!patient) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Bemor topilmadi'
        });
      }

      // Generate invoice number - qisqa format
      const invoiceCount = await Invoice.countDocuments();
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2); // Oxirgi 2 raqam
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const invoiceNumber = `INV-${year}${month}${day}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

      // Calculate total amount
      let totalAmount = 0;
      const invoiceItems = [];

      for (const item of items) {
        // Avval Service modelida qidirish
        let service = await Service.findOne({ 
          _id: item.service_id, 
          is_active: true 
        });

        // Agar Service'da topilmasa, LabTest'da qidirish
        if (!service) {
          const labTest = await LabTest.findOne({
            _id: item.service_id,
            is_active: true
          });
          
          if (labTest) {
            // Lab testni service formatiga o'tkazish
            service = {
              _id: labTest._id,
              name: labTest.name,
              price: labTest.price,
              base_price: labTest.price,
              category: 'Laboratoriya'
            };
          }
        }

        if (!service) {
          await session.abortTransaction();
          return res.status(404).json({
            success: false,
            message: `Xizmat topilmadi: ${item.service_id}`
          });
        }

        // Use custom_price (doctor-specific) > base_price > price
        const servicePrice = item.custom_price !== undefined
          ? parseFloat(item.custom_price)
          : (service.base_price || service.price || 0);
        const itemTotal = servicePrice * (item.quantity || 1);
        totalAmount += itemTotal;

        invoiceItems.push({
          service_id: item.service_id,
          service_name: service.name,
          quantity: item.quantity || 1,
          unit_price: servicePrice,
          total_price: itemTotal
        });
      }

      // Calculate revisit discount (DoctorService dan dinamik, har bir xizmat alohida)
      let revisitDiscount = 0;
      let revisitDiscountReason = '';

      if (patient.last_visit_date) {
        const lastVisit = new Date(patient.last_visit_date);
        lastVisit.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

        if (doctor_id) {
          // Har bir xizmat uchun DoctorService dan chegirma
          for (const invItem of invoiceItems) {
            const dsConfig = await DoctorService.findOne({
              doctor_id, service_id: invItem.service_id, is_active: true
            });
            const rules = dsConfig?.revisit_rules || [
              { min_days: 0, max_days: 3, discount_percent: 100 },
              { min_days: 4, max_days: 7, discount_percent: 50 }
            ];
            for (const rule of rules) {
              if (daysDiff >= rule.min_days && daysDiff <= rule.max_days) {
                revisitDiscount += invItem.total_price * (rule.discount_percent / 100);
                break;
              }
            }
          }
          if (revisitDiscount > 0) {
            revisitDiscountReason = `Qayta qabul (${daysDiff} kun) - chegirma`;
          }
        } else {
          // Fallback: doctor_id yo'q — default qoidalar
          if (daysDiff >= 0 && daysDiff <= 3) {
            revisitDiscount = totalAmount;
            revisitDiscountReason = `Qayta qabul (${daysDiff} kun) - 100% chegirma`;
          } else if (daysDiff >= 4 && daysDiff <= 7) {
            revisitDiscount = totalAmount * 0.50;
            revisitDiscountReason = `Qayta qabul (${daysDiff} kun) - 50% chegirma`;
          }
        }
      }

      // Apply discount with validation
      let discountAmt = discount_amount || 0;
      
      // Add revisit discount to manual discount
      if (revisitDiscount > 0) {
        discountAmt += revisitDiscount;
      }
      
      // Qabulxonachi uchun 20% chegirma cheklovi (faqat manual discount uchun)
      const userRole = req.user.role?.toLowerCase() || '';
      if (userRole === 'reception' || userRole === 'qabulxona' || userRole === 'receptionist') {
        const manualDiscount = discount_amount || 0;
        const maxDiscount = totalAmount * 0.20; // 20% chegirma
        if (manualDiscount > maxDiscount) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Qabulxonachi maksimal 20% chegirma bera oladi. Maksimal: ${maxDiscount.toFixed(2)} so'm`
          });
        }
      }
      
      totalAmount = totalAmount - discountAmt;

      // Determine payment status
      const paidAmt = paid_amount || 0;
      let paymentStatus = 'pending';
      if (paidAmt >= totalAmount) {
        paymentStatus = 'paid';
      } else if (paidAmt > 0) {
        paymentStatus = 'partial';
      }

      // Create invoice
      const invoiceData = {
        patient_id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        paid_amount: paidAmt,
        discount_amount: discountAmt,
        payment_status: paymentStatus,
        payment_method,
        notes: revisitDiscountReason ? `${revisitDiscountReason}${notes ? '. ' + notes : ''}` : notes,
        created_by: req.user.id,
        // Embed items for quick display (without extra DB join)
        items: invoiceItems.map(item => ({
          description: item.service_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      };

      // Add doctor_id to metadata if provided
      if (doctor_id) {
        invoiceData.metadata = {
          doctor_id: doctor_id
        };
      }
      
      // Add revisit discount info to metadata
      if (revisitDiscount > 0) {
        invoiceData.metadata = {
          ...invoiceData.metadata,
          revisit_discount: revisitDiscount,
          revisit_discount_reason: revisitDiscountReason
        };
      }

      const invoice = await Invoice.create([invoiceData], { session });

      // Create invoice items in bulk (optimized)
      const billingItemsData = invoiceItems.map(item => ({
        billing_id: invoice[0]._id,
        service_id: item.service_id,
        service_name: item.service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));
      
      await BillingItem.insertMany(billingItemsData, { session });

      // Create AmbulatorProcedure records so nurses can see and execute procedures
      if (notes === 'Muolaja') {
        // Find bed if room_id and bed_number provided
        let assignedBed = null
        if (room_id && mongoose.Types.ObjectId.isValid(room_id) && bed_number) {
          assignedBed = await Bed.findOne({ room_id, bed_number }).session(session)
          if (!assignedBed) {
            // Create bed if not exists
            const [newBed] = await Bed.create([{
              room_id,
              bed_number,
              status: 'occupied',
              current_patient_id: patient_id,
              occupied_at: new Date()
            }], { session })
            assignedBed = newBed
          } else {
            await Bed.findByIdAndUpdate(assignedBed._id, {
              status: 'occupied',
              current_patient_id: patient_id,
              occupied_at: new Date()
            }, { session })
          }
          // Update room status
          await AmbulatorRoom.findByIdAndUpdate(room_id, { status: 'occupied', current_patient_id: patient_id }, { session })
        }

        const ambulatorProcedures = invoiceItems.map(item => ({
          invoice_id: invoice[0]._id,
          invoice_number: invoiceNumber,
          patient_id,
          service_name: item.service_name,
          quantity: item.quantity || 1,
          status: 'pending',
          ...(assignedBed ? { bed_id: assignedBed._id, bed_number: assignedBed.bed_number } : {})
        }))
        await AmbulatorProcedure.insertMany(ambulatorProcedures, { session })
      }

      // Create transaction if payment made
      if (paidAmt > 0) {
        await Transaction.create([{
          billing_id: invoice[0]._id,
          patient_id,
          amount: paidAmt,
          transaction_type: 'payment',
          payment_method,
          created_by: req.user.id
        }], { session });
      }

      // Update patient's last visit date only (balance calculation removed for performance)
      await Patient.findByIdAndUpdate(
        patient_id,
        { 
          last_visit_date: new Date(),
          updated_at: new Date()
        },
        { session }
      );

      await session.commitTransaction();
      
      // Send Telegram notification for new debt (async, don't wait)
      if (paymentStatus !== 'paid') {
        import('../services/telegram.service.js').then(telegramService => {
          const remainingAmount = totalAmount - paidAmt;
          const description = invoiceItems.map(item => item.service_name).join(', ');
          
          telegramService.sendDebtNotification(patient_id, remainingAmount, description)
            .then(result => {
              // Notification sent
            })
            .catch(error => {
              // Ignore notification error
            });
        });
      }

      res.status(201).json({
        success: true,
        message: 'Hisob-faktura muvaffaqiyatli yaratildi',
        data: {
          invoice: invoice[0].toObject(),
          items: invoiceItems,
          revisit_discount: revisitDiscount,
          revisit_discount_reason: revisitDiscountReason
        }
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/**
 * Get all invoices
 */
router.get('/invoices',
  authenticate,
  authorize('admin', 'receptionist'),
  async (req, res, next) => {
    try {
      const { patient_id, payment_status, from_date, to_date, limit = 50, offset = 0 } = req.query;
      
      const filter = {};
      
      if (patient_id) {
        filter.patient_id = patient_id;
      }
      
      if (payment_status) {
        filter.payment_status = payment_status;
      }
      
      if (from_date || to_date) {
        filter.created_at = {};
        if (from_date) {
          filter.created_at.$gte = new Date(from_date);
        }
        if (to_date) {
          const endDate = new Date(to_date);
          endDate.setHours(23, 59, 59, 999);
          filter.created_at.$lte = endDate;
        }
      }
      
      const invoices = await Invoice.find(filter)
        .populate('patient_id', 'first_name last_name phone')
        .populate('created_by', 'username')
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();
      
      // Format response to match PostgreSQL structure
      const formattedInvoices = invoices.map(inv => ({
        ...inv,
        id: inv._id,
        first_name: inv.patient_id?.first_name,
        last_name: inv.patient_id?.last_name,
        phone: inv.patient_id?.phone,
        created_by_name: inv.created_by?.username
      }));
      
      res.json({
        success: true,
        data: formattedInvoices
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get unpaid invoices for a patient
 * GET /api/v1/billing/invoices/patient/:patientId/unpaid
 */
router.get('/invoices/patient/:patientId/unpaid',
  authenticate,
  async (req, res) => {
    try {
      const { patientId } = req.params

      const unpaidInvoices = await Invoice.find({
        patient_id: patientId,
        payment_status: { $in: ['pending', 'partial'] }
      })
        .select('invoice_number total_amount paid_amount discount_amount payment_status created_at')
        .sort({ created_at: -1 })
        .lean()

      res.json({ success: true, data: unpaidInvoices })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'To\'lanmagan hisob-fakturalarni olishda xatolik'
      })
    }
  }
)

/**
 * Get invoice by invoice_number (for QR scan in Ambulator)
 * GET /api/v1/billing/invoices/by-number/:invoiceNumber
 */
router.get('/invoices/by-number/:invoiceNumber',
  authenticate,
  async (req, res) => {
    try {
      const { invoiceNumber } = req.params
      const invoice = await Invoice.findOne({ invoice_number: invoiceNumber })
        .populate('patient_id', 'first_name last_name phone patient_number')
        .lean()

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Hisob-faktura topilmadi' })
      }

      // Load ambulator procedures for this invoice
      let procedures = []
      try {
        const AmbulatorProcedure = (await import('../models/AmbulatorProcedure.js')).default
        procedures = await AmbulatorProcedure.find({ invoice_id: invoice._id }).lean()
      } catch {}

      res.json({
        success: true,
        data: {
          ...invoice,
          id: invoice._id,
          patient_name: invoice.patient_id ? `${invoice.patient_id.first_name} ${invoice.patient_id.last_name}` : '',
          patient_number: invoice.patient_id?.patient_number,
          procedures
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Xatolik: ' + error.message })
    }
  }
)

/**
 * Get invoice by ID
 */
router.get('/invoices/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  async (req, res, next) => {
    try {
      // Get invoice
      const invoice = await Invoice.findById(req.params.id)
        .populate('patient_id', 'first_name last_name phone patient_number')
        .populate('created_by', 'username')
        .lean();
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Hisob-faktura topilmadi'
        });
      }
      
      // Get invoice items
      // Avval invoice.items array'ini tekshirish
      let items = invoice.items || [];
      
      // Agar invoice.items bo'sh bo'lsa, BillingItem'dan olish (eski invoice'lar uchun)
      if (items.length === 0) {
        const billingItems = await BillingItem.find({ billing_id: req.params.id })
          .sort({ created_at: 1 })
          .lean();
        
        // BillingItem'larni invoice.items formatiga o'tkazish
        items = billingItems.map(bi => ({
          item_type: bi.service_type || 'service',
          description: bi.service_name || bi.description,
          quantity: bi.quantity || 1,
          unit_price: bi.unit_price,
          total_price: bi.total_price,
          notes: bi.notes
        }));
      }
      
      // Get transactions
      const transactions = await Transaction.find({ billing_id: req.params.id })
        .populate('created_by', 'username')
        .sort({ created_at: -1 })
        .lean();
      
      // Format response
      const formattedInvoice = {
        ...invoice,
        id: invoice._id,
        first_name: invoice.patient_id?.first_name,
        last_name: invoice.patient_id?.last_name,
        phone: invoice.patient_id?.phone,
        patient_number: invoice.patient_id?.patient_number,
        created_by_name: invoice.created_by?.username
      };

      const formattedTransactions = transactions.map(t => ({
        ...t,
        id: t._id,
        created_by_name: t.created_by?.username
      }));
      
      res.json({
        success: true,
        data: {
          ...formattedInvoice,
          items,
          transactions: formattedTransactions
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Add payment to invoice
 */
router.post('/invoices/:id/payment',
  authenticate,
  authorize('admin', 'receptionist'),
  async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
      const { error } = addPaymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      await session.startTransaction();

      const { amount, payment_method, reference_number, notes } = req.body;

      // Get invoice
      const invoice = await Invoice.findById(req.params.id).session(session);

      if (!invoice) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Hisob-faktura topilmadi'
        });
      }

      const newPaidAmount = invoice.paid_amount + amount;
      const totalAmount = invoice.total_amount;

      // Check if overpayment
      if (newPaidAmount > totalAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'To\'lov summasi qarzdan oshib ketdi'
        });
      }

      // Determine new payment status
      let paymentStatus = 'partial';
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'paid';
      }

      // Generate QR code if fully paid
      let qrCode = invoice.qr_code;
      let qrCodeActive = invoice.qr_code_active;
      
      if (paymentStatus === 'paid' && !qrCode) {
        // Generate unique QR code: PATIENT_NUMBER-INVOICE_NUMBER
        const patient = await Patient.findById(invoice.patient_id).session(session);
        qrCode = `${patient.patient_number}-${invoice.invoice_number}`;
        qrCodeActive = true;
      } else if (paymentStatus === 'paid') {
        qrCodeActive = true;
      }

      // Update invoice
      invoice.paid_amount = newPaidAmount;
      invoice.payment_status = paymentStatus;
      invoice.payment_method = payment_method;
      invoice.qr_code = qrCode;
      invoice.qr_code_active = qrCodeActive;
      invoice.updated_at = new Date();
      await invoice.save({ session });

      // Create transaction
      await Transaction.create([{
        billing_id: req.params.id,
        patient_id: invoice.patient_id,
        amount,
        transaction_type: 'payment',
        payment_method,
        reference_number,
        notes,
        created_by: req.user.id
      }], { session });

      // Update patient's current balance
      const balanceResult = await Invoice.aggregate([
        {
          $match: { patient_id: invoice.patient_id }
        },
        {
          $group: {
            _id: null,
            total_debt: { $sum: '$total_amount' },
            total_paid: { $sum: '$paid_amount' }
          }
        }
      ]);

      const totalDebt = balanceResult[0]?.total_debt || 0;
      const totalPaid = balanceResult[0]?.total_paid || 0;
      const calculatedBalance = totalPaid - totalDebt;
      
      await Patient.findByIdAndUpdate(
        invoice.patient_id,
        { 
          current_balance: calculatedBalance,
          updated_at: new Date()
        },
        { session }
      );

      await session.commitTransaction();
      await bust('billing:stats');

      res.json({
        success: true,
        message: 'To\'lov muvaffaqiyatli qo\'shildi',
        data: {
          paid_amount: newPaidAmount,
          remaining_amount: totalAmount - newPaidAmount,
          payment_status: paymentStatus,
          patient_balance: calculatedBalance
        }
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/**
 * Get recent transactions
 */
router.get('/transactions',
  authenticate,
  authorize('admin', 'receptionist'),
  async (req, res, next) => {
    try {
      const { patient_id, transaction_type, from_date, to_date, limit = 50, offset = 0 } = req.query;
      
      const filter = {};
      
      if (patient_id) {
        filter.patient_id = patient_id;
      }
      
      if (transaction_type) {
        filter.transaction_type = transaction_type;
      }
      
      if (from_date || to_date) {
        filter.created_at = {};
        if (from_date) {
          filter.created_at.$gte = new Date(from_date);
        }
        if (to_date) {
          const endDate = new Date(to_date);
          endDate.setHours(23, 59, 59, 999);
          filter.created_at.$lte = endDate;
        }
      }
      
      const transactions = await Transaction.find(filter)
        .populate('patient_id', 'first_name last_name phone')
        .populate('billing_id', 'invoice_number')
        .populate('created_by', 'username')
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();
      
      // Format response
      const formattedTransactions = transactions.map(t => ({
        ...t,
        id: t._id,
        first_name: t.patient_id?.first_name,
        last_name: t.patient_id?.last_name,
        phone: t.patient_id?.phone,
        invoice_number: t.billing_id?.invoice_number,
        created_by_name: t.created_by?.username
      }));
      
      res.json({
        success: true,
        data: formattedTransactions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Cancel invoice
 */
router.put('/invoices/:id/cancel',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      // Get invoice
      const invoice = await Invoice.findById(req.params.id).session(session);

      if (!invoice) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Hisob-faktura topilmadi'
        });
      }

      // Check if already paid
      if (invoice.payment_status === 'paid') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'To\'langan hisob-fakturani bekor qilib bo\'lmaydi'
        });
      }

      // Update invoice status
      invoice.payment_status = 'cancelled';
      invoice.updated_at = new Date();
      await invoice.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Hisob-faktura bekor qilindi'
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/**
 * Create new service
 */
router.post('/services',
  authenticate,
  async (req, res, next) => {
    try {
      const { name, category, price, description, is_active, procedure_type, is_cups_based, price_per_cup, procedure_category_id } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Xizmat nomi majburiy'
        });
      }

      // Price can be 0 or any number
      if (price === undefined || price === null || price === '') {
        return res.status(400).json({
          success: false,
          message: 'Xizmat narxi majburiy (0 bo\'lishi mumkin)'
        });
      }

      // Xijoma uchun price_per_cup majburiy
      if (is_cups_based && (price_per_cup === undefined || price_per_cup === null || price_per_cup === '')) {
        return res.status(400).json({
          success: false,
          message: 'Xijoma uchun 1 idish narxi majburiy'
        });
      }

      const service = new Service({
        name,
        category: category || 'Umumiy',
        price: parseFloat(price) || 0,
        description: description || '',
        is_active: is_active !== undefined ? is_active : true,
        procedure_type: procedure_type || null,
        is_cups_based: is_cups_based || false,
        price_per_cup: price_per_cup ? parseFloat(price_per_cup) : null,
        procedure_category_id: procedure_category_id || null
      });
      
      await service.save();
      
      await bust('billing:services', 'billing:service-categories')
      res.status(201).json({
        success: true,
        message: 'Xizmat muvaffaqiyatli qo\'shildi',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update service
 */
router.put('/services/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { name, category, price, description, is_active, procedure_type, is_cups_based, price_per_cup, procedure_category_id } = req.body;

      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Xizmat topilmadi'
        });
      }

      if (name) service.name = name;
      if (category) service.category = category;
      if (price !== undefined && price !== null && price !== '') service.price = parseFloat(price) || 0;
      if (description !== undefined) service.description = description;
      if (is_active !== undefined) service.is_active = is_active;
      if (procedure_type !== undefined) service.procedure_type = procedure_type || null;
      if (is_cups_based !== undefined) service.is_cups_based = is_cups_based;
      if (price_per_cup !== undefined) service.price_per_cup = price_per_cup ? parseFloat(price_per_cup) : null;
      if (procedure_category_id !== undefined) service.procedure_category_id = procedure_category_id || null;
      
      await service.save();
      await bust('billing:services', 'billing:service-categories')
      res.json({
        success: true,
        message: 'Xizmat muvaffaqiyatli yangilandi',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete service
 */
router.delete('/services/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const service = await Service.findById(req.params.id);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Xizmat topilmadi'
        });
      }
      
      // Hard delete - completely remove from database
      await Service.findByIdAndDelete(req.params.id);
      await bust('billing:services', 'billing:service-categories')
      res.json({
        success: true,
        message: 'Xizmat muvaffaqiyatli o\'chirildi'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
