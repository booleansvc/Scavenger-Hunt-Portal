const express = require("express");
const app = express();

const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");

const courses = require("./seeds/courses");
const userSchema = require("./models/user");
const teamSchema = require("./models/team");
const questionsSchema = require("./models/questions");

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
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connection established to the database.");
});

mongoose.set("useCreateIndex", true);

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Team = new mongoose.model("Team", teamSchema);
const Question = new mongoose.model("Question", questionsSchema);

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
        course: courses[req.body.course],
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

app.get("/user-home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("user-home", {
      user: req.user,
    });
  } else {
    res.redirect("/");
  }
});

app
  .route("/admin-home")
  .get(async (req, res) => {
    if (req.isAuthenticated() && req.user.admin === true) {
      var myUsers, myQuestions, myTeams;
      User.find({}, (err, users) => {
        if (err) {
          console.log(err);
        } else {
          Question.find({}, (err, questions) => {
            if (err) {
              console.log(err);
            } else {
              myQuestions = questions;
              Team.find({}, (err, teams) => {
                if (err) {
                  console.log(err);
                } else {
                  myTeams = teams;
                  res.render("admin-home", {
                    users: myUsers,
                    questions: myQuestions,
                    teams: myTeams,
                  });
                }
              });
            }
          });
        }
      });
    } else {
      res.render("login");
    }
  })
  .post(async (req, res) => {
    User.find({}, async (err, users) => {
      if (err) {
        console.log(err);
      } else {
        for (var i = 0; i < users.length; i++) {
          const username = users[i].username;
          await User.findOneAndUpdate(
            {
              username: username,
            },
            {
              group: req.body[username],
            },
            {
              returnNewDocument: false,
            },
            (err, result) => {
              if (err) {
                console.log(err);
              }
            }
          );
        }

        const teams =
          (users.length - 1) % 5 > 0
            ? Math.floor((users.length - 1) / 5) + 1
            : Math.floor((users.length - 1) / 5);

        for (var j = 1; j <= teams; j++) {
          await User.find({ group: "team-" + j }, async (err, results) => {
            if (err) {
              console.log(err);
            } else {
              var currentUsers = [];
              for (var _ = 0; _ < results.length; _++) {
                currentUsers.push(results[_].username);
              }
              await Team.findOneAndUpdate(
                { teamName: "team-" + j },
                { noOfMembers: results.length, memberNames: currentUsers },
                {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true,
                },
                async (err) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Done");
                  }
                }
              );
            }
          });
        }
      }
    });
    res.redirect("/admin-home");
  });

app.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

app.get("/delete/:id", (req, res) => {
  const user_id = req.params.id;
  User.findByIdAndRemove(user_id, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin-home");
    }
  });
});

app.post("/question/add", (req, res) => {
  const question = new Question({
    question: req.body.question,
    answer: req.body.answer,
  });

  question.save();

  res.redirect("/admin-home");
});

app.get("/question/delete/:id", (req, res) => {
  const question_id = mongoose.mongo.ObjectID(req.params.id);
  Question.findByIdAndRemove(question_id, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin-home");
    }
  });
});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("Server Started.");
});
