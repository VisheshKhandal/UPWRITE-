import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import {
  ContactEmailStatus,
  ContactSubmissionModel,
  ContactSubmissionPriority,
  ContactSubmissionType
} from "../models/ContactSubmission";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./email.service";

interface ContactInput {
  type: ContactSubmissionType;
  name?: string;
  email: string;
  title?: string;
  message: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  expectedBenefit?: string;
  priority?: ContactSubmissionPriority;
  satisfactionRating?: number;
  metadata?: {
    browser?: string;
    operatingSystem?: string;
    theme?: string;
    viewport?: string;
    currentUrl?: string;
    currentRoute?: string;
    userAgent?: string;
    user?: string;
    timestamp?: string;
  };
}

interface RequestContext {
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const uploadScreenshot = (file: Express.Multer.File) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "upwrite/support/screenshots",
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const safeErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message.slice(0, 800);
  return "Email delivery failed";
};

const sendSubmissionEmails = async (submissionId: string) => {
  const submission = await ContactSubmissionModel.findById(submissionId);
  if (!submission) return;

  const update: Record<string, unknown> = {};
  const errors: string[] = [];

  try {
    const confirmation = await emailService.sendContactConfirmation(submission);
    update["emailDelivery.confirmationStatus"] = ContactEmailStatus.SENT;
    update["emailDelivery.confirmationMessageId"] = confirmation.id;
  } catch (error) {
    update["emailDelivery.confirmationStatus"] = ContactEmailStatus.FAILED;
    errors.push(`confirmation: ${safeErrorMessage(error)}`);
  }

  try {
    const admin = await emailService.sendContactAdminNotification(submission);
    update["emailDelivery.adminNotificationStatus"] = ContactEmailStatus.SENT;
    update["emailDelivery.adminNotificationMessageId"] = admin.id;
  } catch (error) {
    update["emailDelivery.adminNotificationStatus"] = ContactEmailStatus.FAILED;
    errors.push(`admin: ${safeErrorMessage(error)}`);
  }

  if (errors.length) {
    update["emailDelivery.lastError"] = errors.join(" | ");
    console.warn(`[contact] Email delivery failed for submission ${submissionId}: ${update["emailDelivery.lastError"]}`);
  } else {
    update["emailDelivery.sentAt"] = new Date();
  }

  await ContactSubmissionModel.findByIdAndUpdate(submissionId, { $set: update });
};

export const contactService = {
  async createSubmission(input: ContactInput, file: Express.Multer.File | undefined, context: RequestContext) {
    let screenshot;

    if (file) {
      if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        throw new AppError("Cloudinary is not configured", 500);
      }

      const result = await uploadScreenshot(file);
      screenshot = {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      };
    }

    const user = context.userId ? await UserModel.findById(context.userId).select("name email").lean() : null;
    const submittedAt = input.metadata?.timestamp ? new Date(input.metadata.timestamp) : new Date();

    const submission = await ContactSubmissionModel.create({
      type: input.type,
      user: context.userId,
      name: normalizeOptional(input.name) ?? user?.name,
      email: input.email,
      title: normalizeOptional(input.title),
      message: input.message.trim(),
      expectedBehavior: normalizeOptional(input.expectedBehavior),
      actualBehavior: normalizeOptional(input.actualBehavior),
      expectedBenefit: normalizeOptional(input.expectedBenefit),
      priority: input.priority ?? ContactSubmissionPriority.MEDIUM,
      satisfactionRating: input.satisfactionRating,
      screenshot,
      metadata: {
        browser: normalizeOptional(input.metadata?.browser),
        operatingSystem: normalizeOptional(input.metadata?.operatingSystem),
        theme: normalizeOptional(input.metadata?.theme),
        viewport: normalizeOptional(input.metadata?.viewport),
        currentUrl: normalizeOptional(input.metadata?.currentUrl),
        currentRoute: normalizeOptional(input.metadata?.currentRoute),
        userAgent: normalizeOptional(input.metadata?.userAgent) ?? context.userAgent,
        user: normalizeOptional(input.metadata?.user),
        ipAddress: context.ipAddress,
        submittedAt: Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt
      }
    });

    await sendSubmissionEmails(String(submission._id));

    const fresh = await ContactSubmissionModel.findById(submission._id).lean();
    const emailDelivery = fresh?.emailDelivery;
    const confirmationEmailSent = emailDelivery?.confirmationStatus === ContactEmailStatus.SENT;

    return {
      id: String(submission._id),
      type: submission.type,
      status: submission.status,
      priority: submission.priority,
      emailDelivery,
      confirmation: {
        title: "Thanks!",
        message: confirmationEmailSent
          ? "Every report helps improve Upwrite. We'll review your feedback soon."
          : "Your request was saved, but the confirmation email could not be sent yet. The Upwrite team can still review it.",
        emailSent: confirmationEmailSent
      }
    };
  }
};
