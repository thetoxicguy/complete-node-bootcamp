const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  }); // (payloadObject, secretString, optionsObject)
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token, // To be stored by the client application
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email & password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2. Check if user exists & password is correct
  // This '+password' is needed because the field is not selected by default
  const user = await User.findOne({ email }).select('+password');

  /*
  We test user and correct password together in one step
  to avoid giving potential attackers information
  about wether a user exists or the password is incorrect
  */
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3. If eveerything is OK, send token to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});
