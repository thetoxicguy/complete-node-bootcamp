const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel'); // Only used when embedding users data

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // Validation
      unique: true, // Names are unique in our DB collection (mongoose)
      trim: true, // Remove whitespaces at the beginning and at the end
      minlength: [10, 'The name must be at least 10 characters']
      /*
      isAlpha only allows alphabetic characters and no spaces.
      As we use spaces for the name,
      this validator isn't really helpful.
      */
      // validate: [
      //   validator.isAlpha,
      //   'Tour name should only contain characters with no spaces'
      // ] // No need to call using ()
    },
    slug: {
      type: String
    },
    duration: {
      type: String,
      required: [true, 'A tour must have a duration'] // Validation
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'] // Validation
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'], // Validation
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'] // Validation
    },
    discount: {
      type: Number,
      validate: {
        /*
        This validator only applies for new documents
        it doesn't apply for update (PATCH),
        because of keyword 'this'.
        */
        validator: function(val) {
          return val < this.price; // 'this' points to the document
        },
        message: 'Discount ({VALUE}) should be below the regular price!' // {VALUE} is how mongo access the value
      }
    },
    summary: {
      type: String,
      trim: true, // Remove whitespaces at the beginning and at the end
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true // Remove whitespaces at the beginning and at the end
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      immutable: true, // Doesn't send error, just ignores updates
      default: () => Date.now(),
      select: false
    },
    startDates: [Date],
    exclusiveTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        // This type is addressed to GeoJSON
        type: String, // This nested type is for the schema
        default: 'Point', // This value can be 'Point', 'LineString', 'Polygon'
        enum: ['Point'] // This value can only be 'Point'
      },
      coordinates: [Number], // Longitude, Latitude (GeoJSON counterintuitive order)
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number], // Longitude, Latitude (GeoJSON counterintuitive order)
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // The collection from which we reference the id
      }
    ]
  },
  /*
  We must pass an options object to the schema
  in order to include the virtual properties.
  */
  {
    // Each time it is outputed as JSON we add the virtual properties
    toJSON: { virtuals: true },
    // Each time it is outputed as an object we add the virtual properties
    toObject: { virtuals: true }
  }
);

// ----- Indexes
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 for ascending, -1 for descending
tourSchema.index({ slug: 1 });

/*
The 'virtual' method for schemas generates a property
each time we access the database when using a GET method.
The callback function is not an arrow function, because
we use the 'this' keyword to point to a document's properties
for each one.
*/
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // Duration in weeks
});

// Virtual populate (child documents referencing parent documents)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // "tour" field in the Review model
  localField: '_id'
});

// ----- Document middleware
tourSchema.pre('save', function(next) {
  // eslint-disable-next-line no-console
  console.log('Will save document...');
  next();
});

tourSchema.pre('save', function(next) {
  // 'this' points to the document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// ----- Embedding documents (guides by id)
// tourSchema.pre('save', async function(next) {
//   /*
//   Take the ids of the guides from the array and
//   await for each one as a promise.
//   */
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   // We await for all promises to be resolved to get the guides array
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.post('save', function(doc, next) {
  // eslint-disable-next-line no-console
  console.log(doc._id);
  next();
});

// ----- Query middleware
/*
Suppose we have selected tours not available to anyone
We must include all events that start with find (using regex):
find. findOne, findAndUpdate, findOneAndDelete,... .
*/
tourSchema.pre(/^find/, function(next) {
  // 'this' points to the query,
  // so another .find is chained to our original query
  this.find({ exclusiveTour: { $ne: true } });
  this.start = Date.now();
  next();
});

/*
We populate the guides field with a query middleware (using a regex)
in the User model and we exclude the fields we don't want to show
*/
tourSchema.pre(/^find/, function(next) {
  this.populate({
    // this points to the current query
    path: 'guides', // The field to populate
    select: '-__v -passwordChangedAt' // We can exclude fields for this reference with -
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  // eslint-disable-next-line no-console
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// ----- Aggregation middleware
/*
To avoid editing all aggregations to remove the exclusive tours,
we pass an aggregation middleware
*/
tourSchema.pre('aggregate', function(next) {
  // 'this' points to the aggregation
  this.pipeline().unshift({ $match: { exclusiveTour: { $ne: true } } });
  next();
});

// It is convention to capitalize models
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
