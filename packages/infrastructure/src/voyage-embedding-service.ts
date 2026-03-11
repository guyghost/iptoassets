import { VoyageAIClient } from "voyageai";
import type { EmbeddingService } from "@ipms/application";

export function createVoyageEmbeddingService(apiKey: string): EmbeddingService {
  const client = new VoyageAIClient({ apiKey });

  return {
    async embed(texts) {
      const result = await client.embed({
        input: texts,
        model: "voyage-3",
      });
      return result.data!.map((d) => d.embedding!);
    },
  };
}
