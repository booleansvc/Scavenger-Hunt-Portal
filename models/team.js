const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
  teamName: String,
  noOfMembers: Number,
  memberNames: [String],
  questionsCompleted: Number,
});

module.exports = teamSchema;
