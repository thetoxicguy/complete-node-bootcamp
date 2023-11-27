const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Middleware: a function that can modify the incoming request/response objects in Express
// (in the request/response cycle)
// -------------- 1. Global Middleware (start)
// Set security HTTP headers
app.use(helmet()); // app.use doesn't neet to call a function, but in this case, helmet returns a function. So, it needs to be called

// Development logging
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

// Limit requests from the same IP
// This doesn't work when the application crashes and restarts
app.use('/api', limiter); // only apply to /api (the first argument is optional)

/*
Body parser. Reading data from body into req.body
  In this case, this line allows the execution
  of JSON manipulation in POST, PATCH and DELETE
*/
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against Cross Site Scripting (XSS) attacks
app.use(xss());

// Prevent parameter pollution
// (allow certain duplicate parameters in the query string as a whitelist)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// serving static files
app.use(express.static(`${__dirname}/public/`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});
// -------------- 1. Global Middleware (end)

// -------------- 2. Mount Routes (start)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
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
