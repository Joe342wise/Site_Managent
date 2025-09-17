const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

const schemas = {
  login: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6)
  }),

  createUser: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6),
    email: Joi.string().email().optional(),
    full_name: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'supervisor', 'accountant').default('admin')
  }),

  updateUser: Joi.object({
    username: Joi.string().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    full_name: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'supervisor', 'accountant').optional(),
    is_active: Joi.boolean().optional()
  }),

  createSite: Joi.object({
    name: Joi.string().required().max(200),
    location: Joi.string().optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning'),
    budget_limit: Joi.number().positive().optional(),
    notes: Joi.string().optional()
  }),

  updateSite: Joi.object({
    name: Joi.string().max(200).optional(),
    location: Joi.string().optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    budget_limit: Joi.number().positive().optional(),
    notes: Joi.string().optional()
  }),

  createEstimate: Joi.object({
    site_id: Joi.number().integer().positive().required(),
    title: Joi.string().required().max(200),
    description: Joi.string().optional(),
    date_created: Joi.date().default(new Date())
  }),

  updateEstimate: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'archived').optional()
  }),

  createEstimateItem: Joi.object({
    estimate_id: Joi.number().integer().positive().required(),
    description: Joi.string().required(),
    category_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().positive().default(1),
    unit: Joi.string().required().max(50),
    unit_price: Joi.number().min(0).required(),
    notes: Joi.string().allow('').optional()
  }),

  updateEstimateItem: Joi.object({
    description: Joi.string().optional(),
    category_id: Joi.number().integer().positive().optional(),
    quantity: Joi.number().positive().optional(),
    unit: Joi.string().max(50).optional(),
    unit_price: Joi.number().min(0).optional(),
    notes: Joi.string().allow('').optional()
  }),

  createActual: Joi.object({
    item_id: Joi.number().integer().positive().required(),
    actual_unit_price: Joi.number().min(0).required(),
    actual_quantity: Joi.number().positive().optional(),
    date_recorded: Joi.date().default(new Date()),
    notes: Joi.string().optional()
  }),

  updateActual: Joi.object({
    actual_unit_price: Joi.number().min(0).optional(),
    actual_quantity: Joi.number().positive().optional(),
    date_recorded: Joi.date().optional(),
    notes: Joi.string().optional()
  })
};

module.exports = {
  validateRequest,
  schemas
};