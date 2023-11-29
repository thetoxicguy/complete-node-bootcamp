const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review cannot be empty'],
      maxlength: [500, 'A review must be less than 300 characters']
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  /*
  // This is only if we want to populate the tour along with the user data
    this.populate({
    path: 'tour',
    select: 'name'
  }).populate({
    path: 'user',
    select: 'name photo'
  });
  */
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

/*
This static method sets an aggregation for the model itself
*/
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // 'this' points to the model: Review
  const stats = await this.aggregate([
    {
      $match: { tour: tourId } // Select all reviews that match the tourId
    },
    {
      $group: {
        _id: '$tour', // Group by tour
        nRating: { $sum: 1 }, // Add 1 for each review that matches the tourId
        avgRating: { $avg: '$rating' } // Calculate the average rating for this aggregation
      }
    }
  ]);
  // console.log(stats);
  // Update the tour with the new (nonempty) stats, we don't need to save it
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

/*
This middleware is to include
the average rating and the number of ratings to the tour document
*/
reviewSchema.post('save', function() {
  /*
  'this' points to current review (this.constructor - Review model)
  We call the static method on the model
  */
  this.constructor.calcAverageRatings(this.tour);
});

/*
The two middleware below adds functionality to the update and delete methods
*/
reviewSchema.pre(/^findOneAnd/, async function(next) {
  /*
   * @dev First inject object into query as property.
   * 'this' points to the current query
   * We save the document in the query to use it in the post middleware
   */

  this.r = await this.clone().findOne(); //We clone the query to use it in the post middleware
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  /*
  - 'this' points to the current query,
  - 'this.r' is the review document we saved in the pre middleware
  - @dev From here, we can call the static method calcAverageRatings on the model
  */
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
