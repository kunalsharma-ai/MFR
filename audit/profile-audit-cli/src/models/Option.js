import mongoose from "mongoose";

const dynamicSchema = new mongoose.Schema(
  {},
  {
    strict: false,        // allow any fields
    collection: "Option" // exact collection name
  }
);

const Option = mongoose.model("Option", dynamicSchema);

export default Option;