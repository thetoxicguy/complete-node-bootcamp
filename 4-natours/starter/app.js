const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// -------------- 1. Middleware (start)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // 3rd party middleware
}

// Middleware: a function that can modify the incoming request/response objects in Express
// (in the request/response cycle)
// In this case, this line allows the execution
// of JSON manipulation in POST, PATCH and DELETE
app.use(express.json());

app.use(express.static(`${__dirname}/public/`));
// -------------- 1. Middleware (end)

// -------------- 2. Mount Routes (start)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
// -------------- 2. Mount Routes (end)

module.exports = app;
