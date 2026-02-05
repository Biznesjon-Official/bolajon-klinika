import Joi from 'joi';
import { AppError } from '../utils/errors.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError(JSON.stringify(errors), 400));
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Patient schemas
  createPatient: Joi.object({
    first_name: Joi.string().required().max(100),
    last_name: Joi.string().required().max(100),
    middle_name: Joi.string().max(100).allow('', null),
    phone: Joi.string().required().pattern(/^\+998\d{9}$/),
    passport: Joi.string().max(20).allow('', null),
    pinfl: Joi.string().length(14).pattern(/^\d{14}$/).allow('', null),
    birth_date: Joi.date().required(),
    gender: Joi.string().valid('Male', 'Female').required(),
    blood_type: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('', null),
    telegram_username: Joi.string().max(100).allow('', null),
    region: Joi.string().max(100).allow('', null),
    district: Joi.string().max(100).allow('', null),
    neighborhood: Joi.string().max(200).allow('', null),
    address: Joi.string().allow('', null),
    emergency_contact_name: Joi.string().max(200).allow('', null),
    emergency_contact_phone: Joi.string().pattern(/^\+998\d{9}$/).allow('', null),
    debt_limit: Joi.number().min(0).default(500000)
  }),
  
  updatePatient: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    middle_name: Joi.string().max(100).allow('', null),
    phone: Joi.string().pattern(/^\+998\d{9}$/),
    passport: Joi.string().max(20).allow('', null),
    telegram_username: Joi.string().max(100).allow('', null),
    region: Joi.string().max(100).allow('', null),
    district: Joi.string().max(100).allow('', null),
    neighborhood: Joi.string().max(200).allow('', null),
    address: Joi.string().allow('', null),
    emergency_contact_name: Joi.string().max(200).allow('', null),
    emergency_contact_phone: Joi.string().pattern(/^\+998\d{9}$/).allow('', null),
    debt_limit: Joi.number().min(0),
    is_blocked: Joi.boolean()
  }),
  
  // Queue schemas
  createQueue: Joi.object({
    patient_id: Joi.string().uuid().required(),
    doctor_id: Joi.string().uuid().required(),
    queue_type: Joi.string().valid('NORMAL', 'EMERGENCY').default('NORMAL'),
    notes: Joi.string().allow('', null)
  }),
  
  // Invoice schemas
  createInvoice: Joi.object({
    patient_id: Joi.string().uuid().required(),
    items: Joi.array().items(
      Joi.object({
        service_id: Joi.string().uuid(),
        package_id: Joi.string().uuid(),
        description: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
        unit_price: Joi.number().min(0).required(),
        discount_percentage: Joi.number().min(0).max(100).default(0)
      })
    ).min(1).required(),
    discount_amount: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null)
  }),
  
  // Payment schemas
  createPayment: Joi.object({
    invoice_id: Joi.string().uuid().required(),
    payment_method: Joi.string().valid('CASH', 'CARD', 'TRANSFER', 'ONLINE').required(),
    amount: Joi.number().min(0).required(),
    transaction_id: Joi.string().max(100).allow('', null),
    notes: Joi.string().allow('', null)
  }),
  
  // Lab order schemas
  createLabOrder: Joi.object({
    patient_id: Joi.string().uuid().required(),
    doctor_id: Joi.string().uuid().required(),
    test_types: Joi.array().items(Joi.string().uuid()).min(1).required(),
    priority: Joi.string().valid('NORMAL', 'URGENT', 'STAT').default('NORMAL'),
    notes: Joi.string().allow('', null)
  })
};
