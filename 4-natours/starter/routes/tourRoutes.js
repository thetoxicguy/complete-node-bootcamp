const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours
} = require('../controllers/tourController');

const router = express.Router();

// This ID checking will be done by mongoose instead
// router.param('id', checkID);

// Aliasing common queries with middleware
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

// Actions for the routes are set as middleware
router
  .route('/')
  .get(getAllTours)
  .post(createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
