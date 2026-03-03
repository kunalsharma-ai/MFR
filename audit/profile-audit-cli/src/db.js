const mongoose = require("mongoose");
const { mongoUri } = require("./config");

async function connectDB() {
  await mongoose.connect(mongoUri);
  console.log("Mongo connected");
}

module.exports = { connectDB };