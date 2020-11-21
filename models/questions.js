const mongoose = require("mongoose");

const questionsSchema = mongoose.Schema({
  question: String,
  answer: String,
});

module.exports = questionsSchema;
