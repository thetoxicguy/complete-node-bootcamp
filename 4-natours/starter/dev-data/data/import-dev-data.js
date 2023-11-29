const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const filePath1 = path.join(__dirname, '/tours.json');
const filePath2 = path.join(__dirname, '/users.json');
const filePath3 = path.join(__dirname, '/reviews.json');

dotenv.config({ path: './config.env' });

const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const clusterName = process.env.DB_CLUSTER;
const dbName = process.env.DB_NAME;

const uri = `mongodb+srv://${username}:${password}@${clusterName}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'connection failed: '));
db.once('open', function() {
  // eslint-disable-next-line no-console
  console.log('DB connection successful');
});

// ---------- Reading the file
const tours = JSON.parse(fs.readFileSync(filePath1, 'utf8'));
const users = JSON.parse(fs.readFileSync(filePath2, 'utf8'));
const reviews = JSON.parse(fs.readFileSync(filePath3, 'utf8'));
// eslint-disable-next-line no-console
console.log('File path:', filePath1);
console.log('File path:', filePath2);
console.log('File path:', filePath3);

// ---------- Import data into database
// JSON.parse is used because mongoose uses JS objects, not JSON
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); // Disabled validation for PasswordConfirm
    await Review.create(reviews);
    // eslint-disable-next-line no-console
    console.log('Data successfully loaded');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
  process.exit(); // This finishes the terminal process
};

// ---------- Delete all data from collection
const deleteData = async () => {
  try {
    // Deletes all documents in collection because we do not specify
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    // eslint-disable-next-line no-console
    console.log('Data successfully deleted');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
  process.exit(); // This finishes the terminal process
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// process.argv returns an array
// with the location of the commands we ask in the CLI
// eslint-disable-next-line no-console
console.log(process.argv);
