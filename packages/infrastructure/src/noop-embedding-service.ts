import type { EmbeddingService } from "@ipms/application";

export function createNoOpEmbeddingService(): EmbeddingService {
  return {
    async embed(texts) {
      return texts.map(() => new Array(1024).fill(0));
    },
  };
}
