const Joi = require('joi');

const createOfferSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().max(50)).min(1).max(20).required(),
  radiusKm: Joi.number().min(0.5).max(5).required(),
  home: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }).required(),
  availability: Joi.object().default({}),
});

const updateOfferSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().max(50)).min(1).max(20),
  radiusKm: Joi.number().min(0.5).max(5),
  home: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }),
  availability: Joi.object(),
  isActive: Joi.boolean(),
}).min(1);

const searchOffersSchema = Joi.object({
  lng: Joi.number().min(-180).max(180).required(),
  lat: Joi.number().min(-90).max(90).required(),
  radiusKm: Joi.number().min(0.5).max(5).default(2.5),
  skill: Joi.string().trim().max(50),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createOfferSchema,
  updateOfferSchema,
  searchOffersSchema,
};
