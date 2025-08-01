const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  user_name: {
    type: String,
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  resetPasswordCode: {
    type: String
  },
  resetPasswordCodeExpires: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  withdrawalVerification: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    withdrawalRequest: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate and save withdrawal verification code
userSchema.methods.generateWithdrawalCode = async function(withdrawalData) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.withdrawalVerification = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    withdrawalRequest: withdrawalData
  };
  await this.save();
  return code;
};

// Method to verify withdrawal code
userSchema.methods.verifyWithdrawalCode = async function(code) {
  if (!this.withdrawalVerification || 
      this.withdrawalVerification.code !== code ||
      this.withdrawalVerification.expiresAt < new Date()) {
    return false;
  }
  
  // Clear the code after verification
  this.withdrawalVerification.code = null;
  this.withdrawalVerification.expiresAt = null;
  await this.save();
  
  return this.withdrawalVerification.withdrawalRequest;
};

module.exports = mongoose.model('User', userSchema);