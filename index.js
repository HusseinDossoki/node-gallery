const express       = require('express');
const ejs           = require('ejs');
const path          = require('path');
const mongoose      = require('mongoose');
const bodyParser    = require('body-parser');
const methodOverride = require('method-override');

const database = require('./config/database');

// define the app
const app = express();

// connect to database
mongoose.connect(database.url, {useNewUrlParser: true});
mongoose.connection.on('connected', () => {
  console.log('database connected ....');
});
mongoose.connection.on('error', (err) => {
  console.log(`database not connected: ${err}`);
});


// methodOverride, to make a DELETE or PUT request from the client without using $.ajax({})
app.use(methodOverride('_method'));

// setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// set static folder
app.use(express.static(path.join(__dirname, 'public')));


// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


// define the route
const homeRoute = require('./routes/home');
app.use('/', homeRoute);


// start the serve
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server runs on port ${port} ....`);
});