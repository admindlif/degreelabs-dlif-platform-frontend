import { apiClient } from "./client";
import { FellowContext } from "./types";

export async function getFellowContext(): Promise<FellowContext> {
  return apiClient<FellowContext>("/api/v1/fellow/context");
}
