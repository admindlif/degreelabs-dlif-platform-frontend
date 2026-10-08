import { apiClient } from "./client";
import { ChecklistItem, ChecklistRemindersResponse, FellowChecklistResponse } from "./types";

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
