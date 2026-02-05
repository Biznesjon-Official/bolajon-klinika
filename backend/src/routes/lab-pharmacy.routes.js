import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import LabReagent from '../models/LabReagent.js';
import LabSupplier from '../models/LabSupplier.js';
import LabRequest from '../models/LabRequest.js';

const router = express.Router();

// Get all reagents
router.get('/reagents', authenticate, async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    const reagents = await LabReagent.find(query)
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: reagents.map(r => ({
        id: r._id,
        ...r
      }))
    });
  } catch (error) {
    console.error('Get reagents error:', error);
    next(error);
  }
});

// Get single reagent
router.get('/reagents/:id', authenticate, async (req, res, next) => {
  try {
    const reagent = await LabReagent.findById(req.params.id).lean();
    
    if (!reagent) {
      return res.status(404).json({
        success: false,
        message: 'Reagent topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: reagent._id,
        ...reagent
      }
    });
  } catch (error) {
    console.error('Get reagent error:', error);
    next(error);
  }
});

// Create reagent
router.post('/reagents', authenticate, authorize('admin', 'laborant'), async (req, res, next) => {
  try {
    const {
      name,
      category,
      unit,
      quantity,
      unit_price,
      reorder_level,
      expiry_date,
      storage_condition,
      manufacturer,
      lot_number,
      notes
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nomi majburiy'
      });
    }
    
    const reagent = new LabReagent({
      name,
      category,
      unit,
      quantity,
      unit_price,
      reorder_level,
      expiry_date,
      storage_condition,
      manufacturer,
      lot_number,
      notes
    });
    
    await reagent.save();
    
    res.status(201).json({
      success: true,
      message: 'Reagent yaratildi',
      data: {
        id: reagent._id,
        name: reagent.name
      }
    });
  } catch (error) {
    console.error('Create reagent error:', error);
    next(error);
  }
});

// Update reagent
router.put('/reagents/:id', authenticate, authorize('admin', 'laborant'), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;
    
    const reagent = await LabReagent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!reagent) {
      return res.status(404).json({
        success: false,
        message: 'Reagent topilmadi'
      });
    }
    
    res.json({
      success: true,
      message: 'Reagent yangilandi',
      data: reagent
    });
  } catch (error) {
    console.error('Update reagent error:', error);
    next(error);
  }
});

// Delete reagent
router.delete('/reagents/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const reagent = await LabReagent.findByIdAndDelete(req.params.id);
    
    if (!reagent) {
      return res.status(404).json({
        success: false,
        message: 'Reagent topilmadi'
      });
    }
    
    res.json({
      success: true,
      message: 'Reagent o\'chirildi'
    });
  } catch (error) {
    console.error('Delete reagent error:', error);
    next(error);
  }
});

// Get statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [
      totalReagents,
      lowStock,
      outOfStock,
      expired
    ] = await Promise.all([
      LabReagent.countDocuments(),
      LabReagent.countDocuments({ status: 'low_stock' }),
      LabReagent.countDocuments({ status: 'out_of_stock' }),
      LabReagent.countDocuments({ status: 'expired' })
    ]);
    
    res.json({
      success: true,
      data: {
        total_reagents: totalReagents,
        low_stock: lowStock,
        out_of_stock: outOfStock,
        expired: expired
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    next(error);
  }
});

// ============================================
// SUPPLIERS
// ============================================

// Get all suppliers
router.get('/suppliers', authenticate, async (req, res, next) => {
  try {
    const suppliers = await LabSupplier.find({ status: 'active' })
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: suppliers.map(s => ({
        id: s._id,
        ...s
      }))
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    next(error);
  }
});

// Create supplier
router.post('/suppliers', authenticate, authorize('admin', 'laborant'), async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nomi va telefon majburiy'
      });
    }
    
    const supplier = new LabSupplier({
      name,
      contact_person,
      phone,
      email,
      address,
      notes
    });
    
    await supplier.save();
    
    res.status(201).json({
      success: true,
      message: 'Yetkazib beruvchi qo\'shildi',
      data: { id: supplier._id, name: supplier.name }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    next(error);
  }
});

// ============================================
// REQUESTS
// ============================================

// Get all requests
router.get('/requests', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await LabRequest.find(query)
      .populate('supplier_id', 'name phone')
      .populate('requested_by', 'first_name last_name')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: requests.map(r => ({
        id: r._id,
        request_number: r.request_number,
        reagent_name: r.reagent_name,
        quantity: r.quantity,
        unit: r.unit,
        supplier: r.supplier_id ? {
          id: r.supplier_id._id,
          name: r.supplier_id.name,
          phone: r.supplier_id.phone
        } : null,
        requested_by: r.requested_by ? {
          id: r.requested_by._id,
          name: `${r.requested_by.first_name} ${r.requested_by.last_name}`
        } : null,
        status: r.status,
        urgency: r.urgency,
        notes: r.notes,
        created_at: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get requests error:', error);
    next(error);
  }
});

// Create request
router.post('/requests', authenticate, authorize('admin', 'laborant'), async (req, res, next) => {
  try {
    const { reagent_name, quantity, unit, supplier_id, urgency, notes } = req.body;
    
    if (!reagent_name || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Reagent nomi va miqdor majburiy'
      });
    }
    
    const request = new LabRequest({
      reagent_name,
      quantity,
      unit,
      supplier_id,
      requested_by: req.user.id,
      urgency,
      notes
    });
    
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Buyurtma yaratildi',
      data: {
        id: request._id,
        request_number: request.request_number
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    next(error);
  }
});

// Update request status
router.put('/requests/:id/status', authenticate, authorize('admin', 'laborant'), async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    
    if (status === 'ordered') {
      updateData.ordered_at = new Date();
    } else if (status === 'received') {
      updateData.received_at = new Date();
    }
    
    const request = await LabRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi'
      });
    }
    
    res.json({
      success: true,
      message: 'Status yangilandi',
      data: request
    });
  } catch (error) {
    console.error('Update request status error:', error);
    next(error);
  }
});

export default router;
