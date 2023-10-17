const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

// ---------- Extra middleware to be applied in assigned routes
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// ---------- Middleware to be applied in tourRoutes.ts
exports.getAllTours = async (req, res) => {
  try {
    // ----- Execute query
    // query.sort().select().skip().limit()
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    // ----- Send response
    res.status(200).json({
      status: 'success',
      results: tours.length, //not mandatory for jsend
      data: {
        tours: tours // When the key has the same name, we can just write it, omitting : tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    // 201 is the response code for creating a new entry
    res.status(201).json({
      status: 'success',
      data: { tour: newTour }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err // Pending for error handling
    });
  }
  // throw new Error(err);
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({ _id: req.params.id});
    res.status(200).json({
      status: 'success',
      data: {
        tour // When the key has the same name, we can just write it, omitting : tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
// This is just a simulation.
// The real response should be the modified entry from the database
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // The new updated document wil be returned
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

// This is just a simulation.
// The real response should be the modified entry from the database
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // 204 is the status for deletion
    res.status(204).json({
      status: 'success',
      data: null // This is the usual response for deletion
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
