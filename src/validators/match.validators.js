const Joi = require('joi');

const createMatchSchema = Joi.object({
  requestId: Joi.string().hex().length(24).required(),
  offerId: Joi.string().hex().length(24).required(),
});

const updateMatchStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'active', 'enroute', 'arrived', 'completed', 'cancelled')
    .required(),
});

const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
  attachments: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      type: Joi.string().valid('image', 'video', 'file').required(),
      publicId: Joi.string(),
    })
  ).max(5),
});

const getMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

module.exports = {
  createMatchSchema,
  updateMatchStatusSchema,
  sendMessageSchema,
  getMessagesSchema,
};
