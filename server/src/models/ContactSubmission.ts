import { Schema, model, type InferSchemaType } from "mongoose";

export enum ContactSubmissionType {
  BUG_REPORT = "bug_report",
  FEATURE_REQUEST = "feature_request",
  GENERAL_FEEDBACK = "general_feedback",
  CREATOR_CONTACT = "creator_contact"
}

export enum ContactSubmissionStatus {
  OPEN = "open",
  IN_REVIEW = "in_review",
  PLANNED = "planned",
  RESOLVED = "resolved",
  CLOSED = "closed",
  SPAM = "spam"
}

export enum ContactSubmissionPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum ContactEmailStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed"
}

const screenshotSchema = new Schema(
  {
    publicId: String,
    url: String,
    secureUrl: String,
    resourceType: String,
    format: String,
    bytes: Number,
    width: Number,
    height: Number
  },
  { _id: false }
);

const metadataSchema = new Schema(
  {
    browser: String,
    operatingSystem: String,
    theme: String,
    viewport: String,
    currentUrl: String,
    currentRoute: String,
    userAgent: String,
    ipAddress: String,
    submittedAt: Date
  },
  { _id: false }
);

const emailDeliverySchema = new Schema(
  {
    confirmationStatus: {
      type: String,
      enum: Object.values(ContactEmailStatus),
      default: ContactEmailStatus.PENDING
    },
    adminNotificationStatus: {
      type: String,
      enum: Object.values(ContactEmailStatus),
      default: ContactEmailStatus.PENDING
    },
    confirmationMessageId: String,
    adminNotificationMessageId: String,
    lastError: String,
    sentAt: Date
  },
  { _id: false }
);

const contactSubmissionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(ContactSubmissionType),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ContactSubmissionStatus),
      default: ContactSubmissionStatus.OPEN,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(ContactSubmissionPriority),
      default: ContactSubmissionPriority.MEDIUM,
      index: true
    },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    title: { type: String, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    expectedBehavior: { type: String, trim: true, maxlength: 2500 },
    actualBehavior: { type: String, trim: true, maxlength: 2500 },
    expectedBenefit: { type: String, trim: true, maxlength: 2500 },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    screenshot: screenshotSchema,
    metadata: { type: metadataSchema, default: {} },
    emailDelivery: { type: emailDeliverySchema, default: {} },
    internalNotes: [{ type: String, trim: true, maxlength: 2000 }],
    duplicateOf: { type: Schema.Types.ObjectId, ref: "ContactSubmission" },
    deletedAt: Date
  },
  { timestamps: true }
);

contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ type: 1, status: 1, createdAt: -1 });
contactSubmissionSchema.index({ email: 1, createdAt: -1 });
contactSubmissionSchema.index({ title: "text", message: "text", expectedBehavior: "text", actualBehavior: "text", expectedBenefit: "text" });

export type ContactSubmission = InferSchemaType<typeof contactSubmissionSchema>;
export const ContactSubmissionModel = model("ContactSubmission", contactSubmissionSchema);
