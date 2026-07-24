import { env } from "./env";

const personalEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com"
]);

const DEVELOPMENT_FROM_NAME = "Upwrite";
const DEVELOPMENT_FROM_ADDRESS = "onboarding@resend.dev";

const getEmailDomain = (email: string) => email.split("@")[1]?.toLowerCase();

export const isPersonalEmailSender = (email: string) => {
  const domain = getEmailDomain(email);
  return Boolean(domain && personalEmailDomains.has(domain));
};

const requireEmailValue = (value: string | undefined, name: string) => {
  if (!value) throw new Error(`${name} is required for email delivery`);
  return value;
};

export const emailConfig = {
  mode: env.EMAIL_MODE,
  fromName: env.EMAIL_MODE === "development" ? DEVELOPMENT_FROM_NAME : requireEmailValue(env.EMAIL_FROM_NAME, "EMAIL_FROM_NAME"),
  fromAddress: env.EMAIL_MODE === "development"
    ? DEVELOPMENT_FROM_ADDRESS
    : requireEmailValue(env.EMAIL_FROM_ADDRESS, "EMAIL_FROM_ADDRESS"),
  replyToEmail: requireEmailValue(env.REPLY_TO_EMAIL, "REPLY_TO_EMAIL"),
  adminEmail: requireEmailValue(env.ADMIN_EMAIL, "ADMIN_EMAIL"),
  get from() {
    return `${this.fromName} <${this.fromAddress}>`;
  }
};
