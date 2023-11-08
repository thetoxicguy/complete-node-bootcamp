const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan
} = require('../controllers/tourController');
const { protect } = require('../controllers/authController');

const router = express.Router();

// Aliasing common queries with middleware
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

// Actions for the routes are set as middleware
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router
  .route('/')
  .get(protect, getAllTours)
  .post(createTour);

/*
Important Notice: Parameters act as middleware, so
the routes that come after are accumulative
*/
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
