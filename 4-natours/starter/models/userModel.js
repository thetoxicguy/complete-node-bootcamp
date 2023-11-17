const crypto = require('crypto');
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true, // New users are active by default
    select: false // This field won't be included in the output
  }
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

userSchema.pre('save', function(next) {
  /*
  If the password is not modified or the document is new,
  we don't want to update the passwordChangedAt field
  */
  if (!this.isModified('password') || this.isNew) return next();
  /*
  We substract 1 second to the passwordChangedAt field
  because sometimes the token is created before the passwordChangedAt
  and ensure that the token is always created after the passwordChangedAt
  */
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } }); // This points to the current query
  next();
}); // All queries that start with find

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

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken) // We hash the resetToken
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken; // This is the unhashed token to use in the email
};

// It is convention to capitalize models
const User = mongoose.model('User', userSchema);

module.exports = User;
