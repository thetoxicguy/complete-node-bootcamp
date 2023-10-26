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
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8
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

// It is convention to capitalize models
const User = mongoose.model('User', userSchema);

module.exports = User;
