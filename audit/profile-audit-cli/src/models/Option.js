const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema({
  question: String,
  label: String,
  value: String,
  parentValue: [String]
});

module.exports = mongoose.model("Option", OptionSchema);