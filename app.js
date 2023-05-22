const express = require('express');
const app = express();

const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


// Requiring user route
const userRoutes = require('./routes/users');
const billRoutes = require('./routes/bills');
const detailRoutes = require('./routes/details');
const stipendRoutes = require('./routes/stipend');
const admindash = require('./routes/admindash');
const crud = require('./routes/crud');


// Requiring user model
const User = require('./models/usermodel');
const Stipend = require('./models/stipendmodel');
const Detail = require('./models/detailsmodel');

const combine = require('./models/billsmodel');
const Bill = combine.billsSchema;
const Report = combine.reportsSchema;

dotenv.config({path : './config.env'});

mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser : true,
    useUnifiedTopology : true
});

// Middleware for session
app.use(session({
    secret : 'Just a simple login/signup application.',
    resave : true,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({usernameField : 'email'}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// FOR BILLS MIDDLEWEAR
app.use(express.urlencoded({extended : false}));
app.use(express.json());

// RECORD Bills Image
app.use(express.static("bills"));

// Link with CSS files
app.use(express.static(path.join(__dirname, 'assets')))

// Middleware for flash messages
app.use(flash());

// Setting middleware globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error')); // Login error
    res.locals.currentUser = req.user; // To see only the authenticated user can access some features.
    next();
})

// set template engine
app.use(bodyParser.urlencoded({extended : true}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use("/", userRoutes);
app.use("/", billRoutes);
app.use("/", detailRoutes);
app.use("/", stipendRoutes);
app.use("/", admindash);
app.use("/", crud);

app.listen(process.env.PORT, () => {
    console.log(`The server is running at http://localhost:${process.env.PORT}`);
})
