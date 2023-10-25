const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ---------- Extra middleware to be applied in assigned routes
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// ---------- Middleware to be applied in tourRoutes.ts
exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length, //not mandatory for jsend
    data: {
      tours: tours // When the key has the same name, we can just write it, omitting : tours
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  // 201 is the response code for creating a new entry
  res.status(201).json({
    status: 'success',
    data: { tour: newTour }
  });
  // try {
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err // Pending for error handling
  //   });
  // }
  // throw new Error(err);
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id});

  // Error handling for valid id syntax with no results
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour // When the key has the same name, we can just write it, omitting : tours
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // The new updated document wil be returned
    runValidators: true
  });

  // Error handling for valid id syntax with no results
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // We just add this for the next line in order to evaluate the data
  const tour = await Tour.findByIdAndDelete(req.params.id);

  // Error handling for valid id syntax with no results
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 204 is the status for deletion
  res.status(204).json({
    status: 'success',
    data: null // This is the usual response for deletion
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: null, // All the tours together
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // Just adds one for each tour entry
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: 1 } }
    // { $match: { _id: { $ne: 'EASY' } } }
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      // Given a standard array inside each of our documents,
      // unwind creates a copy of the document for each item in the array
      // and substitutes the array with the corresponding value
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' } // Creates an array with the tour names that match
      }
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } }, // Tho show the busiest month
    { $limit: 10 }
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});
