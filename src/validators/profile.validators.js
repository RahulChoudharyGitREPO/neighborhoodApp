const Joi = require('joi');
const config = require('../config/env');

const updateProfileSchema = Joi.object({
  displayName: Joi.string().trim().min(2).max(100),
  bio: Joi.string().trim().max(500).allow(''),
  skills: Joi.array().items(Joi.string().trim().max(50)).max(20),
  radiusKm: Joi.number()
    .min(config.geo.min_radius_km)
    .max(config.geo.max_radius_km),
  role: Joi.string().valid('helper', 'requester', 'both'),
  home: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }),
}).min(1); // At least one field must be provided

const confirmAvatarSchema = Joi.object({
  publicId: Joi.string().required(),
  secureUrl: Joi.string().uri().required(),
});

const updateEmailStartSchema = Joi.object({
  newEmail: Joi.string().email().lowercase().required(),
  currentPassword: Joi.string().required(),
});

const updateEmailConfirmSchema = Joi.object({
  token: Joi.string().required(),
});

const updatePhoneStartSchema = Joi.object({
  newPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  currentPassword: Joi.string().required(),
});

const updatePhoneConfirmSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const updatePrivacySchema = Joi.object({
  maskExactLocation: Joi.boolean(),
  blockUserId: Joi.string().hex().length(24),
  unblockUserId: Joi.string().hex().length(24),
}).min(1);

module.exports = {
  updateProfileSchema,
  confirmAvatarSchema,
  updateEmailStartSchema,
  updateEmailConfirmSchema,
  updatePhoneStartSchema,
  updatePhoneConfirmSchema,
  updatePrivacySchema,
};
