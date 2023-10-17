const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
//
// This was used before the db.once was available
// .then(con => {
// eslint-disable-next-line no-console
// console.log(con.connections); // Prints the connections object
// eslint-disable-next-line no-console
// console.log('DB connection successful');
// });

const db = mongoose.connection;
// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'connection failed: '));
db.once('open', function() {
  // eslint-disable-next-line no-console
  console.log('DB connection successful');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App is running on port ${port}...`);
});
