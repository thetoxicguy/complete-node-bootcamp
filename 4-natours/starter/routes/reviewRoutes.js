const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview
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
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(updateReview)
  .delete(deleteReview);

module.exports = router;
