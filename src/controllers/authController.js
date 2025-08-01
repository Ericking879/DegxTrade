const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken, generateUserId } = require('../utils/auth');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/emailService');
const validator = require('validator');
const jwt = require('jsonwebtoken');


exports.register = async (req, res, next) => {
  try {
    const { user_name, full_name, email, password, confirmPassword } = req.body;

    console.log('Register attempt:', { user_name, email });

    if (!user_name || !full_name || !email || !password || !confirmPassword) {
      console.error('Missing required fields:', { user_name, full_name, email, password: !!password, confirmPassword: !!confirmPassword });
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (password !== confirmPassword) {
      console.error('Password mismatch');
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    if (!validator.isEmail(email)) {
      console.error('Invalid email:', email);
      return next(new ErrorResponse('Invalid email address', 400));
    }

    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { user_name: user_name.toLowerCase() }] });
    if (userExists) {
      console.error('User already exists:', { email, user_name, existing: userExists });
      return next(new ErrorResponse('User already exists', 400));
    }

    let user_id;
    let idExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    while (idExists && attempts < maxAttempts) {
      user_id = generateUserId();
      console.log(`Generated user_id (attempt ${attempts + 1}):`, user_id);
      idExists = await User.findOne({ user_id });
      attempts++;
    }

    if (idExists) {
      console.error('Failed to generate unique user_id after', maxAttempts, 'attempts');
      return next(new ErrorResponse('Unable to generate a unique user ID', 500));
    }

    let verificationCode;
    let codeExists = true;
    attempts = 0;

    while (codeExists && attempts < maxAttempts) {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Generated verification code (attempt ${attempts + 1}):`, verificationCode);
      codeExists = await User.findOne({ verificationCode });
      attempts++;
    }

    if (codeExists) {
      console.error('Failed to generate unique verification code after', maxAttempts, 'attempts');
      return next(new ErrorResponse('Unable to generate a unique verification code', 500));
    }

    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await sendVerificationEmail(email, verificationCode);

    const user = await User.create({
      user_id,
      user_name,
      full_name,
      email,
      password,
      verificationCode,
      verificationCodeExpires
    });

    console.log('User created:', { user_id, user_name, email });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.'
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      code: error.code,
      keyValue: error.keyValue || 'N/A',
      stack: error.stack
    });
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return next(new ErrorResponse(`A user with this ${field} already exists: ${value}`, 400));
    }
    if (error.message === 'Failed to send verification email') {
      return next(new ErrorResponse('Failed to send verification email. Please try again later.', 500));
    }
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { verificationCode } = req.body;

    console.log('Verify email attempt:', { verificationCode });

    if (!verificationCode) {
      console.error('Missing verification code');
      return next(new ErrorResponse('Please provide a verification code', 400));
    }

    const user = await User.findOne({
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.error('Invalid or expired verification code:', { verificationCode });
      return next(new ErrorResponse('Invalid or expired verification code', 400));
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('Email verified for user:', { email: user.email });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    console.log('Forgot password attempt:', { email });

    if (!email) {
      console.error('Missing email');
      return next(new ErrorResponse('Please provide an email address', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found:', { email });
      return next(new ErrorResponse('No user found with that email', 404));
    }

    let resetPasswordCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    while (codeExists && attempts < maxAttempts) {
      resetPasswordCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Generated reset code (attempt ${attempts + 1}):`, resetPasswordCode);
      codeExists = await User.findOne({ resetPasswordCode });
      attempts++;
    }

    if (codeExists) {
      console.error('Failed to generate unique reset code after', maxAttempts, 'attempts');
      return next(new ErrorResponse('Unable to generate a unique reset code', 500));
    }

    user.resetPasswordCode = resetPasswordCode;
    user.resetPasswordCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendResetPasswordEmail(email, resetPasswordCode);

    console.log('Reset code email sent to:', { email });

    res.status(200).json({
      success: true,
      message: 'Reset code sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetPasswordCode, password, confirmPassword } = req.body;

    console.log('Reset password attempt:', { resetPasswordCode });

    if (!resetPasswordCode || !password || !confirmPassword) {
      console.error('Missing required fields');
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    if (password !== confirmPassword) {
      console.error('Password mismatch');
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    const user = await User.findOne({
      resetPasswordCode,
      resetPasswordCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.error('Invalid or expired reset code:', { resetPasswordCode });
      return next(new ErrorResponse('Invalid or expired reset code', 400));
    }

    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save();

    console.log('Password reset successful for user:', { email: user.email });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (!user.isVerified) {
      return next(new ErrorResponse('Please verify your email first', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Use 'id' instead of 'user_id' in JWT payload to match auth.js
    const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('Generated token:', token);

    // Set session (optional, since asset.js uses token)
    req.session.user = {
      user_id: user.user_id,
      email: user.email,
      token
    };

    // Set cookie (non-httpOnly for asset.js)
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      maxAge: process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 30 * 24 * 60 * 60 * 1000
    });
    console.log('Cookie set with token:', token);

    res.status(200).json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack
    });
    next(new ErrorResponse('Server error', 500));
  }
};

exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    console.log('Resend verification code attempt:', { email });

    if (!email) {
      console.error('Missing email');
      return next(new ErrorResponse('Please provide an email', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found:', { email });
      return next(new ErrorResponse('No user found with that email', 404));
    }

    if (user.isVerified) {
      console.error('User already verified:', { email });
      return next(new ErrorResponse('Email is already verified', 400));
    }

    let verificationCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    while (codeExists && attempts < maxAttempts) {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Generated verification code (attempt ${attempts + 1}):`, verificationCode);
      codeExists = await User.findOne({ verificationCode });
      attempts++;
    }

    if (codeExists) {
      console.error('Failed to generate unique verification code after', maxAttempts, 'attempts');
      return next(new ErrorResponse('Unable to generate a unique verification code', 500));
    }

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log('New verification code generated:', { verificationCode });

    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully'
    });
  } catch (error) {
    console.error('Resend verification code error:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Clear the token cookie
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0) // Expire immediately
    });

    // Destroy session
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          console.error('Session destroy error:', err);
          return next(err);
        }
      });
    }

    console.log('Logout successful');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};