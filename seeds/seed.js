const mongoose = require("mongoose");
const casual = require("casual");
const userSchema = require("../models/user");
const courses = require("./courses");

require("dotenv").config();

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

const User = new mongoose.model("User", userSchema);

function Seeder(number) {
  for (var i = 0; i < number; i++) {
    const tempUser = new User({
      username: casual.username,
      fullName: casual.full_name,
      course: courses[Math.floor(Math.random() * courses.length)],
      year: Math.floor(Math.random() * 2) + 1,
      email: casual.email,
      phoneNumber: casual.numerify("##########"),
    });

    tempUser.save();
  }
}

Seeder(30);
