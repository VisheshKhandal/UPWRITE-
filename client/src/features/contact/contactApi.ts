import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";

export type ContactSubmissionType = "bug_report" | "feature_request" | "general_feedback" | "creator_contact";
export type ContactPriority = "low" | "medium" | "high" | "urgent";

export interface ContactSubmissionInput {
  type: ContactSubmissionType;
  name?: string;
  email: string;
  title?: string;
  message: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  expectedBenefit?: string;
  priority?: ContactPriority;
  satisfactionRating?: number;
  screenshot?: File | null;
  metadata?: Record<string, string>;
}

export interface ContactSubmissionResult {
  id: string;
  type: ContactSubmissionType;
  status: string;
  priority: ContactPriority;
  emailDelivery?: {
    confirmationStatus?: "pending" | "sent" | "failed";
    adminNotificationStatus?: "pending" | "sent" | "failed";
    lastError?: string;
  };
  confirmation: {
    title: string;
    message: string;
    emailSent: boolean;
  };
}

const createFormData = (input: ContactSubmissionInput) => {
  const formData = new FormData();
  formData.append("type", input.type);
  formData.append("email", input.email);
  formData.append("message", input.message);

  if (input.name) formData.append("name", input.name);
  if (input.title) formData.append("title", input.title);
  if (input.expectedBehavior) formData.append("expectedBehavior", input.expectedBehavior);
  if (input.actualBehavior) formData.append("actualBehavior", input.actualBehavior);
  if (input.expectedBenefit) formData.append("expectedBenefit", input.expectedBenefit);
  if (input.priority) formData.append("priority", input.priority);
  if (input.satisfactionRating) formData.append("satisfactionRating", String(input.satisfactionRating));
  if (input.metadata) formData.append("metadata", JSON.stringify(input.metadata));
  if (input.screenshot) formData.append("screenshot", input.screenshot);

  return formData;
};

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createContactSubmission: builder.mutation<ContactSubmissionResult, ContactSubmissionInput>({
      query: (input) => ({
        url: "/contact/submissions",
        method: "POST",
        body: createFormData(input)
      }),
      transformResponse: (response: ApiResponse<ContactSubmissionResult>) => unwrapResponse(response),
      invalidatesTags: ["Contact"]
    })
  })
});

export const { useCreateContactSubmissionMutation } = contactApi;
