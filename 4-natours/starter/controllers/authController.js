const { promisify } = require('util');
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
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
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

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it exists in the request
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(1);
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401)
    );
  }
  // 2. Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3. Check if user still exists
  /*
  Most tutorials do not consider this security issue.
  It may happen that the token is still active, but:
  - The user has been deleted
  - The user might have change the password
  */
  const currenthUser = await User.findById(decoded.id);
  if (!currenthUser) {
    return next(
      new AppError('The user for this token does no longer exist.', 401)
    );
  }
  // 4. Check if user changed password after the token was issued
  if (currenthUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }

  // Grant access to protected (with this middleware) route
  req.user = currenthUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    /*
    roles is an array of strings, e.g. ['admin', 'lead-guide']
    req.user.role is a string, e.g. 'user'
    */
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // 2. Generate the random reset token
  user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // We save the document in the database without running schema validators

  // 3. Send it to user's email
});
exports.resetPassword = (req, res, next) => {};
