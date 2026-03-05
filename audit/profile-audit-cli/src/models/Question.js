import mongoose from "mongoose";

const dynamicSchema = new mongoose.Schema(
  {},
  {
    strict: false,        // allow any fields
    collection: "Question" // exact collection name
  }
);

const Question = mongoose.model("Question", dynamicSchema);

export default Question;