const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ---------- Middleware to be applied in reviewRoutes.ts
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId }; // We filter by tourId if it exists
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length, //not mandatory for jsend
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // We take the user id from protect middleware
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { review: newReview }
  });
});
