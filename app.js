const express = require("express");
const app = express();

const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = require("./models/user");
const { isBuffer } = require("util");

require("dotenv").config();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_DB_SERVER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connection established to the database.");
});

mongoose.set("useCreateIndex", true);

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.route("/").get((req, res) => {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          if (req.user.admin === true) {
            res.redirect("/admin-home");
          } else {
            res.redirect("/user-home");
          }
        });
      }
    });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register(
      {
        username: req.body.username,
        fullName: req.body.fullName,
        course: req.body.course,
        year: req.body.year,
        rollNo: req.body.rollNo,
        phoneNumber: req.body.phone,
        email: req.body.email,
        admin: false,
      },
      req.body.password,
      (err) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/user-home");
          });
        }
      }
    );
  });

app.get("/user-home", (req, res) => {});

app.get("/admin-home", (req, res) => {});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("Server Started.");
});
