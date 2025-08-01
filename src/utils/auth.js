const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.generateUserId = () => {
  const userId = 'DEG' + uuidv4().replace(/-/g, '').substring(0, 9).toUpperCase();
  console.log('Generated user_id:', userId); // Log for debugging
  return userId;
};