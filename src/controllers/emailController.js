const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return next(new ErrorResponse('No verification token provided', 400));
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return next(new ErrorResponse('Invalid verification token', 400));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};