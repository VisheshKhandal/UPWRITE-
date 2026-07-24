import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { env } from "./env";

const ensureOAuthProviderIndex = async () => {
  try {
    await UserModel.collection.dropIndex("provider_1_providerId_1");
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 27) throw error;
  }

  await UserModel.collection.createIndex(
    { provider: 1, providerId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        providerId: { $exists: true, $type: "string", $gt: "" }
      }
    }
  );
};

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI);
  await ensureOAuthProviderIndex();
  console.log("MongoDB connected");
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
