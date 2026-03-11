import Anthropic from "@anthropic-ai/sdk";
import type { AIService } from "@ipms/application";

export function createClaudeAIService(apiKey: string): AIService {
  const client = new Anthropic({ apiKey });

  return {
    async complete(systemPrompt, userPrompt) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content[0];
      return block.type === "text" ? block.text : "";
    },
  };
}
