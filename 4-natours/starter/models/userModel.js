const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a user name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please fill-in the user email'],
    unique: true,
    lowercase: true, // Not validation, it converts to lowercase
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false // This field won't be included in the output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      /*
      Warning: This validation
      only works on create and save (POST), not in update (PATCH)
      */
      validator: function(el) {
        return el === this.password;
      },
      message: 'Password confirmation failed'
    }
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  // isModified is a method always present in a document
  if (!this.isModified('password')) return next();
  /*
  hash the password: (password, salt).
  salt is a number for encryption complexity cost
  */
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // We reset the passwordConfirm
  next();
});

// Instance method to include it in every document for this model
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // candidatePassword is not hashed, but userPassword is
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false; // false means "not changed"
};

// It is convention to capitalize models
const User = mongoose.model('User', userSchema);

module.exports = User;
