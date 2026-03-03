const { body, validationResult } = require('express-validator');

/**
 * Validation middleware to check for errors
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * Registration validation rules
 */
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['citizen', 'ngo', 'volunteer', 'admin']).withMessage('Invalid role'),
  body('name').notEmpty().withMessage('Name is required'),
  validate
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

/**
 * Report creation validation rules
 */
const reportValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('userEditedDescription').optional().isString(),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  reportValidation
};
