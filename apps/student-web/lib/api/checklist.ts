import { apiClient } from "./client";
import {
  ChecklistFeedbackMessage,
  ChecklistFeedbackThreadResponse,
  ChecklistItem,
  ChecklistRemindersResponse,
  FellowChecklistResponse,
} from "./types";

export async function getFellowChecklistReminders(): Promise<ChecklistRemindersResponse> {
  return apiClient<ChecklistRemindersResponse>("/api/v1/fellow/checklist-reminders");
}

export async function getFellowChecklist(): Promise<FellowChecklistResponse> {
  return apiClient<FellowChecklistResponse>("/api/v1/fellow/checklist");
}

export async function updateChecklistCompletion(
  itemId: string,
  isCompleted: boolean
): Promise<ChecklistItem> {
  return apiClient<ChecklistItem>(
    `/api/v1/fellow/checklist/${itemId}/completion`,
    {
      method: "PUT",
      body: JSON.stringify({ is_completed: isCompleted }),
    }
  );
}

/**
 * Submit or update fellow's contribution and reflection for a checklist item.
 * Marks the item as completed and status as 'pending_review'.
 */
export async function submitChecklistResponse(
  itemId: string,
  contribution: string,
  reflection: string,
  myThoughts?: string
): Promise<ChecklistItem> {
  return apiClient<ChecklistItem>(
    `/api/v1/fellow/checklist/${itemId}/response`,
    {
      method: "PUT",
      body: JSON.stringify({ contribution, reflection, my_thoughts: myThoughts }),
    }
  );
}

/**
 * Get the checklist feedback message thread for a checklist item.
 */
export async function getChecklistFeedback(
  itemId: string
): Promise<ChecklistFeedbackThreadResponse> {
  return apiClient<ChecklistFeedbackThreadResponse>(
    `/api/v1/fellow/checklist/${itemId}/feedback`
  );
}

/**
 * Post a new message into the checklist feedback thread.
 */
export async function postChecklistFeedback(
  itemId: string,
  message: string
): Promise<ChecklistFeedbackMessage> {
  return apiClient<ChecklistFeedbackMessage>(
    `/api/v1/fellow/checklist/${itemId}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}
