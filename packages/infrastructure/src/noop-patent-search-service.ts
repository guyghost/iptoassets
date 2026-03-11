import type { PatentSearchService } from "@ipms/application";

export function createNoOpPatentSearchService(): PatentSearchService {
  return {
    async search() { return []; },
  };
}
