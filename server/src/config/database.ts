import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
