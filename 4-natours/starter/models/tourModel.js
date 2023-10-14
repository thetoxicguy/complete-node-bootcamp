const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], // Validation
    unique: true, // Names are unique in our DB collection (mongoose)
    trim: true // Remove whitespaces at the beginning and at the end
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
    required: [true, 'A tour must have difficulty'] // Validation
  },
  ratingsAverage: {
    type: Number,
    default: 4.5
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
    type: Number
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
    default: Date.now()
  },
  startDates: [Date]
});

// It is convention to capitalize models
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
