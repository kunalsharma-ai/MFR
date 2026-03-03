const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: String,
  parent: String,
  description: String,
  category: [String],
  adminLabel: String,
  isMoney: Boolean,
  isRequired: Boolean,
  isEditable: Boolean,
  hasOthers: Boolean,
  hasNone: Boolean,
  hasSkip: Boolean,
  size: String
});

module.exports = mongoose.model("Question", QuestionSchema);