const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  course: String,
  year: Number,
  email: String,
  phoneNumber: Number,
  rollNo: Number,
  admin: Boolean,
});

module.exports = userSchema;
