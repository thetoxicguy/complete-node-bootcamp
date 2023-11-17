const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// -------------- 1. Global Middleware (start)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // 3rd party middleware that notifies info about the requests
}

// 3rd party middleware that limits the number of requests from an IP
// (DDOS protection)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour'
});

// This doesn't work when the application crashes and restarts
app.use('/api', limiter); // only apply to /api (the first argument is optional)

// Middleware: a function that can modify the incoming request/response objects in Express
// (in the request/response cycle)
// In this case, this line allows the execution
// of JSON manipulation in POST, PATCH and DELETE
app.use(express.json());

app.use(express.static(`${__dirname}/public/`));
// -------------- 1. Global Middleware (end)

// -------------- 2. Mount Routes (start)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
// -------------- 2. Mount Routes (end)

// -------------- 3. Error Handling (start)
// ----- Unhandled routes (last middleware, after valid routes) (start)
// all stands for all methods
app.all('*', (req, res, next) => {
  // const err = new Error(`Cannot find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ----- Centralized Error Handling
app.use(globalErrorHandler);

// -------------- 3. Error Handling (end)
module.exports = app;
