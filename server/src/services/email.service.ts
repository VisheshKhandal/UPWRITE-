import { emailConfig } from "../config/email";
import { env } from "../config/env";
import { ContactSubmissionType, type ContactSubmission } from "../models/ContactSubmission";
import { AppError } from "../utils/AppError";

interface EmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface EmailResult {
  id?: string;
}

type SubmissionDocument = ContactSubmission & { _id: unknown; createdAt?: Date; updatedAt?: Date };

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const labelByType: Record<ContactSubmissionType, string> = {
  [ContactSubmissionType.BUG_REPORT]: "Bug Report",
  [ContactSubmissionType.FEATURE_REQUEST]: "Feature Request",
  [ContactSubmissionType.GENERAL_FEEDBACK]: "General Feedback",
  [ContactSubmissionType.CREATOR_CONTACT]: "Contact Creator"
};

const userSubjectByType: Record<ContactSubmissionType, string> = {
  [ContactSubmissionType.BUG_REPORT]: "We received your Upwrite bug report",
  [ContactSubmissionType.FEATURE_REQUEST]: "Thanks for suggesting an Upwrite feature",
  [ContactSubmissionType.GENERAL_FEEDBACK]: "Thanks for sharing feedback with Upwrite",
  [ContactSubmissionType.CREATOR_CONTACT]: "Your message to Upwrite was received"
};

const introByType: Record<ContactSubmissionType, string> = {
  [ContactSubmissionType.BUG_REPORT]: "Thanks for reporting this issue. Every clear report helps make Upwrite more reliable for everyone.",
  [ContactSubmissionType.FEATURE_REQUEST]: "Thanks for sharing the problem you want Upwrite to solve better. Product feedback is most useful when it starts from a real user need.",
  [ContactSubmissionType.GENERAL_FEEDBACK]: "Thanks for taking the time to share your experience. Thoughtful feedback helps shape Upwrite with more care.",
  [ContactSubmissionType.CREATOR_CONTACT]: "Thanks for reaching out. Your message has been received and can be reviewed from Upwrite's support records."
};

const baseLayout = (title: string, preheader: string, body: string) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f7f7f5;color:#181817;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e5df;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;border-bottom:1px solid #e7e5df;">
                <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#348a6d;font-weight:700;">Upwrite</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#181817;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">${body}</td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e7e5df;color:#6f6f68;font-size:13px;line-height:1.7;">
                Upwrite is a learning-in-public platform for reading deeply, practicing knowledge, and building a public knowledge identity.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const summaryRows = (items: Array<[string, unknown]>) =>
  items
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;color:#6f6f68;font-size:13px;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:#181817;font-size:14px;line-height:1.6;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

const userConfirmationHtml = (submission: SubmissionDocument) => {
  const name = submission.name?.trim() || "there";
  const label = labelByType[submission.type as ContactSubmissionType];
  return baseLayout(
    userSubjectByType[submission.type as ContactSubmissionType],
    introByType[submission.type as ContactSubmissionType],
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#3f3f3a;">${escapeHtml(introByType[submission.type as ContactSubmissionType])}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eeeae4;border-bottom:1px solid #eeeae4;margin:20px 0;">
        ${summaryRows([
          ["Type", label],
          ["Title", submission.title],
          ["Priority", submission.priority],
          ["Status", submission.status],
          ["Reference ID", String(submission._id)]
        ])}
      </table>
      <p style="margin:22px 0 0;font-size:14px;line-height:1.8;color:#6f6f68;">You do not need to resend this. The submission is safely stored and can be reviewed by the Upwrite team.</p>
    `
  );
};

const adminNotificationHtml = (submission: SubmissionDocument) => {
  const metadata = submission.metadata ?? {};
  return baseLayout(
    `New ${labelByType[submission.type as ContactSubmissionType]} in Upwrite`,
    "A new Contact & Feedback submission has arrived.",
    `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#3f3f3a;">A new submission was saved in MongoDB. The database record is the source of truth.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eeeae4;border-bottom:1px solid #eeeae4;margin:20px 0;">
        ${summaryRows([
          ["Database ID", String(submission._id)],
          ["Type", labelByType[submission.type as ContactSubmissionType]],
          ["Status", submission.status],
          ["Priority", submission.priority],
          ["Name", submission.name],
          ["Email", submission.email],
          ["Title", submission.title],
          ["Message", submission.message],
          ["Expected behavior", submission.expectedBehavior],
          ["Actual behavior", submission.actualBehavior],
          ["Expected benefit", submission.expectedBenefit],
          ["Rating", submission.satisfactionRating],
          ["Screenshot", submission.screenshot?.secureUrl ?? submission.screenshot?.url],
          ["Current route", metadata.currentRoute],
          ["Current URL", metadata.currentUrl],
          ["Browser", metadata.browser],
          ["Operating system", metadata.operatingSystem],
          ["Theme", metadata.theme],
          ["Viewport", metadata.viewport],
          ["User agent", metadata.userAgent],
          ["IP address", metadata.ipAddress],
          ["Submitted at", metadata.submittedAt?.toISOString?.() ?? metadata.submittedAt],
          ["Created at", submission.createdAt?.toISOString?.()]
        ])}
      </table>
    `
  );
};

const sendEmail = async (input: EmailInput): Promise<EmailResult> => {
  if (!env.RESEND_API_KEY) throw new AppError("RESEND_API_KEY is not configured", 500);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: emailConfig.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo ?? emailConfig.replyToEmail
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[email] Resend request failed", {
      status: response.status,
      to: input.to,
      from: emailConfig.from,
      replyTo: input.replyTo ?? emailConfig.replyToEmail,
      payload
    });
    const message = typeof payload?.message === "string" ? payload.message : "Resend email request failed";
    throw new AppError(message, response.status >= 500 ? 502 : 400);
  }

  return { id: typeof payload?.id === "string" ? payload.id : undefined };
};

export const emailService = {
  async sendContactConfirmation(submission: SubmissionDocument) {
    if (!submission.email) throw new AppError("Submission email is missing", 500);
    return sendEmail({
      to: submission.email,
      subject: userSubjectByType[submission.type as ContactSubmissionType],
      html: userConfirmationHtml(submission),
      replyTo: emailConfig.replyToEmail
    });
  },

  async sendContactAdminNotification(submission: SubmissionDocument) {
    if (!submission.email) throw new AppError("Submission email is missing", 500);
    const label = labelByType[submission.type as ContactSubmissionType];
    return sendEmail({
      to: emailConfig.adminEmail,
      subject: `New Upwrite ${label}: ${submission.title || String(submission._id)}`,
      html: adminNotificationHtml(submission),
      replyTo: emailConfig.replyToEmail
    });
  }
};
