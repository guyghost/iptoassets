import type { AIService } from "@ipms/application";

export function createNoOpAIService(): AIService {
  return {
    async complete() {
      return "";
    },
  };
}
