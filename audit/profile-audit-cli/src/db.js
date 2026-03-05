import mongoose from "mongoose";
import { mongoUri } from "./config.js";

export async function connectDB() {
  console.log("Connecting DB "+mongoUri)
  await mongoose.connect(mongoUri);
  console.log("Mongo connected");
}
