const mongoose = require('mongoose');
const dotenv = require('dotenv');

// ----- Catching Uncaught Exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); // This command terminates the process
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const clusterName = process.env.DB_CLUSTER;
const dbName = process.env.DB_NAME;

const uri = `mongodb+srv://${username}:${password}@${clusterName}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  // useFindAndModify: false
  // useCreateIndex: true
});

const db = mongoose.connection;
// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'connection failed: '));
db.once('open', function() {
  // eslint-disable-next-line no-console
  console.log('DB connection successful');
});

const port = process.env.PORT || 3000;

// ----- Unhandled Rejections
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App is running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    // This gives the server time to finnish all pending requests
    process.exit(1); // This command terminates the process
  });
});
