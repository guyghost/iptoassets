export interface Asset {
  id: string;
  title: string;
  type: string;
  jurisdiction: { code: string; name: string };
  status: string;
  filingDate: string;
  expirationDate: string;
  owner: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const assets: Asset[] = [
  { id: "1", title: "Neural Interface Patent", type: "patent", jurisdiction: { code: "US", name: "United States" }, status: "filed", filingDate: "2026-01-15", expirationDate: "2046-01-15", owner: "Alex Chen", organizationId: "org-1", createdAt: "2026-01-10", updatedAt: "2026-03-05" },
  { id: "2", title: "Quantum Logo Mark", type: "trademark", jurisdiction: { code: "EU", name: "European Union" }, status: "granted", filingDate: "2025-06-20", expirationDate: "2035-06-20", owner: "Sarah Kim", organizationId: "org-1", createdAt: "2025-06-18", updatedAt: "2026-03-03" },
  { id: "3", title: "AI Training Dataset", type: "copyright", jurisdiction: { code: "US", name: "United States" }, status: "draft", filingDate: "", expirationDate: "", owner: "Alex Chen", organizationId: "org-1", createdAt: "2026-03-01", updatedAt: "2026-03-01" },
  { id: "4", title: "Holographic Display", type: "patent", jurisdiction: { code: "JP", name: "Japan" }, status: "published", filingDate: "2025-09-10", expirationDate: "2045-09-10", owner: "Takeshi Yamamoto", organizationId: "org-1", createdAt: "2025-09-08", updatedAt: "2026-02-28" },
  { id: "5", title: "BioSync Wearable Design", type: "design-right", jurisdiction: { code: "GB", name: "United Kingdom" }, status: "granted", filingDate: "2025-03-12", expirationDate: "2040-03-12", owner: "Emma Watson", organizationId: "org-1", createdAt: "2025-03-10", updatedAt: "2026-01-15" },
  { id: "6", title: "SmartGrid Energy Patent", type: "patent", jurisdiction: { code: "DE", name: "Germany" }, status: "expired", filingDate: "2006-04-22", expirationDate: "2026-04-22", owner: "Hans Mueller", organizationId: "org-1", createdAt: "2006-04-20", updatedAt: "2026-02-01" },
  { id: "7", title: "EcoFlow Brand Identity", type: "trademark", jurisdiction: { code: "US", name: "United States" }, status: "filed", filingDate: "2026-02-10", expirationDate: "2036-02-10", owner: "Sarah Kim", organizationId: "org-1", createdAt: "2026-02-08", updatedAt: "2026-02-28" },
  { id: "8", title: "Adaptive UI Framework", type: "copyright", jurisdiction: { code: "EU", name: "European Union" }, status: "granted", filingDate: "2025-11-05", expirationDate: "2095-11-05", owner: "Alex Chen", organizationId: "org-1", createdAt: "2025-11-03", updatedAt: "2026-01-20" },
  { id: "9", title: "NanoFilter Membrane", type: "patent", jurisdiction: { code: "CN", name: "China" }, status: "abandoned", filingDate: "2024-08-15", expirationDate: "", owner: "Li Wei", organizationId: "org-1", createdAt: "2024-08-12", updatedAt: "2025-12-01" },
  { id: "10", title: "AeroLens Optics Design", type: "design-right", jurisdiction: { code: "KR", name: "South Korea" }, status: "filed", filingDate: "2026-01-28", expirationDate: "2041-01-28", owner: "Ji-Hoon Park", organizationId: "org-1", createdAt: "2026-01-25", updatedAt: "2026-03-02" },
];

export const assetsMap: Record<string, Asset> = Object.fromEntries(
  assets.map((a) => [a.id, a])
);
