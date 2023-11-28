const express = require('express');
const {
  getAllReviews,
  createReview
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

/*
meergeParams: true allows the router to access parameters in both routes indiscriminately
POST /tour/:tourID/reviews
GET /tour/:tourID/reviews
POST /reviews
*/
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

module.exports = router;
