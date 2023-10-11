const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../dev-data/data/', 'tours-simple.json');

const tours = JSON.parse(fs.readFileSync(dataPath));

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price'
    });
  }
  next();
};

exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length, //not mandatory for jsend
    data: {
      tours: tours // When the key has the same name, we can just write it, omitting : tours
    }
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);
  // This action reloads the server, so we can read updated data
  fs.writeFile(
    dataPath,
    JSON.stringify(tours),
    // eslint-disable-next-line no-unused-vars
    err => {
      // 201 is the response code for creating a new entry
      res.status(201).json({
        status: 'success',
        data: { tour: newTour }
      });
      // throw new Error(err);
    }
  );
};

exports.getTour = (req, res) => {
  // console.log(req.params);
  const id = req.params.id * 1;

  // This is a preliminary solution in the case the id is not in our array
  const tour = tours.find(item => item.id === id);
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour // When the key has the same name, we can just write it, omitting : tours
    }
  });
};

// This is just a simulation.
// The real response should be the modified entry from the database
exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<updated tour here...>'
    }
  });
};

// This is just a simulation.
// The real response should be the modified entry from the database
exports.deleteTour = (req, res) => {
  // 204 is the status for deletion
  res.status(204).json({
    status: 'success',
    data: null // This is the usual response for deletion
  });
};
