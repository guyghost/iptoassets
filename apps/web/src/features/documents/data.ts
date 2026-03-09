export type DocumentType = "filing" | "correspondence" | "certificate" | "evidence" | "other";
export type DocumentStatus = "uploaded" | "under-review" | "approved" | "rejected";

export interface Document {
  id: string;
  assetId: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  status: DocumentStatus;
  organizationId: string;
}

export const documents: Document[] = [
  { id: "1", assetId: "1", name: "Neural Interface Patent Application.pdf", type: "filing", url: "/docs/1", uploadedAt: "Mar 7, 2026", status: "approved", organizationId: "org-1" },
  { id: "2", assetId: "2", name: "Quantum Logo Trademark Certificate.pdf", type: "certificate", url: "/docs/2", uploadedAt: "Mar 6, 2026", status: "approved", organizationId: "org-1" },
  { id: "3", assetId: "3", name: "AI Training Dataset Copyright Filing.docx", type: "filing", url: "/docs/3", uploadedAt: "Mar 5, 2026", status: "under-review", organizationId: "org-1" },
  { id: "4", assetId: "4", name: "USPTO Office Action Response.pdf", type: "correspondence", url: "/docs/4", uploadedAt: "Mar 4, 2026", status: "under-review", organizationId: "org-1" },
  { id: "5", assetId: "1", name: "Prior Art Search Report.pdf", type: "evidence", url: "/docs/5", uploadedAt: "Mar 3, 2026", status: "approved", organizationId: "org-1" },
  { id: "6", assetId: "5", name: "Holographic Display Provisional Filing.pdf", type: "filing", url: "/docs/6", uploadedAt: "Mar 2, 2026", status: "rejected", organizationId: "org-1" },
  { id: "7", assetId: "2", name: "Brand Guidelines Document.pdf", type: "other", url: "/docs/7", uploadedAt: "Mar 1, 2026", status: "uploaded", organizationId: "org-1" },
  { id: "8", assetId: "6", name: "EPO Grant Certificate.pdf", type: "certificate", url: "/docs/8", uploadedAt: "Feb 28, 2026", status: "approved", organizationId: "org-1" },
  { id: "9", assetId: "3", name: "Inventor Declaration Form.pdf", type: "correspondence", url: "/docs/9", uploadedAt: "Feb 27, 2026", status: "uploaded", organizationId: "org-1" },
  { id: "10", assetId: "4", name: "Lab Notebook Excerpts.pdf", type: "evidence", url: "/docs/10", uploadedAt: "Feb 25, 2026", status: "rejected", organizationId: "org-1" },
];

export const assetNames: Record<string, string> = {
  "1": "Neural Interface Patent",
  "2": "Quantum Logo Mark",
  "3": "AI Training Dataset",
  "4": "Holographic Display",
  "5": "Holographic Display Prov.",
  "6": "Biotech Sensor Patent",
};
