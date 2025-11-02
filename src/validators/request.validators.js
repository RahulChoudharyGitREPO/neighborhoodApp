const Joi = require('joi');

const createRequestSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  details: Joi.string().trim().min(10).max(2000).required(),
  category: Joi.string()
    .valid('errands', 'moving', 'repairs', 'gardening', 'tech', 'tutoring', 'other')
    .required(),
  whenTime: Joi.date().iso().min('now').required(),
  location: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }).required(),
});

const updateRequestSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  details: Joi.string().trim().min(10).max(2000),
  category: Joi.string()
    .valid('errands', 'moving', 'repairs', 'gardening', 'tech', 'tutoring', 'other'),
  whenTime: Joi.date().iso().min('now'),
  location: Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
  }),
  status: Joi.string().valid('open', 'cancelled'),
}).min(1);

const searchRequestsSchema = Joi.object({
  lng: Joi.number().min(-180).max(180).required(),
  lat: Joi.number().min(-90).max(90).required(),
  radiusKm: Joi.number().min(0.5).max(5).default(2.5),
  category: Joi.string().valid('errands', 'moving', 'repairs', 'gardening', 'tech', 'tutoring', 'other'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createRequestSchema,
  updateRequestSchema,
  searchRequestsSchema,
};
