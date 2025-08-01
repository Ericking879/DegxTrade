const Joi = require('joi');

const depositSchema = Joi.object({
  coin: Joi.string().valid('BTC', 'ETH', 'USDT', 'BNB').required(),
  network: Joi.string().valid('Bitcoin', 'Ethereum', 'TRON', 'BSC').required()
});

const validateDepositRequest = (req, res, next) => {
  const { error } = depositSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateDepositRequest };