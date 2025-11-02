const Joi = require('joi');

const createRatingSchema = Joi.object({
  toUserId: Joi.string().hex().length(24).required(),
  matchId: Joi.string().hex().length(24).required(),
  stars: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(500).allow(''),
});

const getRatingsSchema = Joi.object({
  summary: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createRatingSchema,
  getRatingsSchema,
};
