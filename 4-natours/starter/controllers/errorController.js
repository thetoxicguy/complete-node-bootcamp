const AppError = require('../utils/appError');

// ----- Error Handler for invalid IDs (mongoose)
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// ----- Error Handler for validation errors (mongoose)
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// ----- Error Handler for Duplicate (unique) Fields (mongoose)
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/"(.*?)"/)[0];
  console.log(`Error. Value ${value} already exists`);
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

// ----- Error Handler for invalid token
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

// ----- Error Handler for expired token
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// ----- Error Handler for development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// ----- Error Handler for production environment
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    // 1. Log error
    // eslint-disable-next-line no-console
    // console.error('ERROR 💥', err);

    // 2. Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong.'
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    /*
    This is different from the course due to a mongoose update:
      The message and name properties have been moved to the prototype of 'err'
      and not in the base object itself ('err').
      So, the solution is to use Object.create instead of "let error = { ...err }"".
    */
    let error = Object.create(err);
    // console.log('error 👀: ', error.message);
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
