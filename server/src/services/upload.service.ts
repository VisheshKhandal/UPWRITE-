import type { UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { cloudinary } from "../config/cloudinary";
import { UploadAssetModel, UploadContext } from "../models/UploadAsset";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";

const uploadBuffer = (buffer: Buffer, folder: string) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
      resolve(result);
    });

    stream.end(buffer);
  });

export const uploadService = {
  async uploadImage(userId: string, file: Express.Multer.File | undefined, context: UploadContext) {
    if (!file) throw new AppError("Image file is required", 400);
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new AppError("Cloudinary is not configured", 500);
    }

    const result = await uploadBuffer(file.buffer, `upwrite/${context}`);

    const asset = await UploadAssetModel.create({
      owner: userId,
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      context
    });

    if (context === UploadContext.AVATAR) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          avatar: {
            url: result.secure_url,
            publicId: result.public_id
          }
        }
      });
    }

    return asset;
  }
};
