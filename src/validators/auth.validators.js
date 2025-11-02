const Joi = require('joi');

const registerSchema = Joi.object({
  displayName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(100).required(),
  home: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).required(),
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const confirmPasswordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
};
