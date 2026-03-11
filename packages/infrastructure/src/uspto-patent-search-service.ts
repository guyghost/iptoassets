import type { PatentSearchService, PatentSearchResult } from "@ipms/application";

export function createUSPTOPatentSearchService(): PatentSearchService {
  return {
    async search(query, limit) {
      const body = {
        q: { _text_any: { patent_abstract: query } },
        f: ["patent_number", "patent_title", "patent_abstract"],
        o: { per_page: limit },
      };

      let response: Response;
      try {
        response = await fetch("https://api.patentsview.org/patents/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        return [];
      }

      if (!response.ok) return [];

      let data: Record<string, unknown>;
      try {
        data = await response.json() as Record<string, unknown>;
      } catch {
        return [];
      }

      const patents = Array.isArray(data.patents) ? data.patents : [];
      return patents
        .filter((p: unknown): p is Record<string, string> => p !== null && typeof p === "object")
        .map((p): PatentSearchResult => ({
          patentNumber: String(p.patent_number ?? ""),
          title: String(p.patent_title ?? ""),
          abstractText: String(p.patent_abstract ?? ""),
        }))
        .filter((p) => p.patentNumber && p.title);
    },
  };
}
