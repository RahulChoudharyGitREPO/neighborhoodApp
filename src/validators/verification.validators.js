const Joi = require('joi');

const startEmailVerificationSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const confirmEmailVerificationSchema = Joi.object({
  token: Joi.string().required(),
});

const startPhoneVerificationSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
});

const confirmPhoneVerificationSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  startEmailVerificationSchema,
  confirmEmailVerificationSchema,
  startPhoneVerificationSchema,
  confirmPhoneVerificationSchema,
};
