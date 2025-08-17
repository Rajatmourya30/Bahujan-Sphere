"use server";

import { suggestEventTags } from "@/ai/flows/suggest-event-tags";

export async function getTagSuggestions(eventDescription: string, existingTags: string[]) {
  try {
    if (!eventDescription.trim()) {
      return { suggestedTags: [] };
    }
    const result = await suggestEventTags({ eventDescription, existingTags });
    return result;
  } catch (error) {
    console.error("Error suggesting event tags:", error);
    // In a real app, you'd want to handle this more gracefully
    return { suggestedTags: [], error: "Failed to get suggestions." };
  }
}
