const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    // We just add this for the next line in order to evaluate the data
    const doc = await Model.findByIdAndDelete(req.params.id);

    // Error handling for valid id syntax with no results
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // 204 is the status for deletion
    res.status(204).json({
      status: 'success',
      data: null // This is the usual response for deletion
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // The new updated document wil be returned
      runValidators: true
    });

    // Error handling for valid id syntax with no results
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc // We will deal with the specific 'data' in the controller
      }
    });
  });

/*
- This doesn't apply for Users,
  because we have the signup route for that
- In the case of reviews, we need additional middleware 
  to get the tourId and userId
*/
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    // 201 is the response code for creating a new entry
    res.status(201).json({
      status: 'success',
      data: { data: doc }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // Error handling for valid id syntax with no results
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // We filter by tourId if it exists

    const features = new APIFeatures(Model.find(filter), req.query) // Passing the query through APIFeatures for security reasons in the operations described below
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain(); // We use explain to see the stats of the query
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length, //not mandatory for jsend
      data: {
        data: doc
      }
    });
  });
