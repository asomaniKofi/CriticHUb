require("dotenv").config();
let express = require("express");
let app =express();
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
//mongoose.connect("mongodb://localhost/Critichub");
mongoose.connect("mongodb+srv://admin:critichuballday2019@critichub-ftr1m.mongodb.net/CriticHub?retryWrites=true");
let Restaurant =require("./models/restaurants");
let Review = require("./models/Review");
let Seed = require("./seeds");
let passport = require("passport");
let local = require("passport-local"); 
let User = require("./models/User");
let RestaurantRoute = require("./routes/Restaurants");
let ReviewRoute = require("./routes/Reviews");
let Other = require("./routes/Authentication");
let Admin = require("./routes/Admin");
let UserRoutes = require("./routes/User");
let MethodOverride = require("method-override");
let flash = require("connect-flash");
let expressValidator = require("express-validator");
require('./config/custompassport.js')(passport);

//Seed();
app.use(flash());
app.use(bodyParser.urlencoded({extended:false}));
app.use(expressValidator());
app.set("view engine","ejs");
app.use(express.static(__dirname+ "/public/"));
app.use(express.static(__dirname + '/views/partials'));
app.use(MethodOverride("_method"));
//Passport Configuration
app.use(require("express-session")({
   secret:"CriticHub in Progress",
    resave:true,
    saveUninitialized:true,
    cookie: { secure: "auto" }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new local(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next){
     res.locals.currentUser = req.user;
     res.locals.error = req.flash("Error");
     res.locals.success = req.flash("Success");
     next();
 });
 app.use(function(err,req,res,next){
          req.flash("Error",err.message);
          res.redirect("back");
 });

//Routes
app.use(Other);
app.use(RestaurantRoute);
app.use(ReviewRoute);
app.use(Admin);
app.use(UserRoutes);
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Welcome to the Hub");
});
