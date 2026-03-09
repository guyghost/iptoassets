export interface Deadline {
  id: string;
  assetId: string;
  type: "renewal" | "response" | "filing" | "review" | "custom";
  title: string;
  dueDate: string;
  completed: boolean;
  organizationId: string;
  assetName: string;
}

export const today = new Date("2026-03-09");

export const mockDeadlines: Deadline[] = [
  { id: "1", assetId: "a1", type: "response", title: "Office action response - Neural Interface Patent", dueDate: "2026-03-05", completed: false, organizationId: "org1", assetName: "Neural Interface Patent" },
  { id: "2", assetId: "a2", type: "renewal", title: "Annual renewal fee - Quantum Logo Mark", dueDate: "2026-03-03", completed: false, organizationId: "org1", assetName: "Quantum Logo Mark" },
  { id: "3", assetId: "a3", type: "filing", title: "PCT national phase entry - Holographic Display", dueDate: "2026-03-07", completed: false, organizationId: "org1", assetName: "Holographic Display" },
  { id: "4", assetId: "a4", type: "renewal", title: "Maintenance fee payment - BioSensor Array", dueDate: "2026-03-10", completed: false, organizationId: "org1", assetName: "BioSensor Array" },
  { id: "5", assetId: "a5", type: "review", title: "Prior art review - Smart Fabric Weave", dueDate: "2026-03-11", completed: false, organizationId: "org1", assetName: "Smart Fabric Weave" },
  { id: "6", assetId: "a6", type: "response", title: "Examiner interview preparation - MicroLens Array", dueDate: "2026-03-12", completed: false, organizationId: "org1", assetName: "MicroLens Array" },
  { id: "7", assetId: "a7", type: "filing", title: "Provisional application filing - Edge ML Compiler", dueDate: "2026-03-14", completed: false, organizationId: "org1", assetName: "Edge ML Compiler" },
  { id: "8", assetId: "a8", type: "custom", title: "Inventor declaration signature - Nano Coating Process", dueDate: "2026-03-15", completed: false, organizationId: "org1", assetName: "Nano Coating Process" },
  { id: "9", assetId: "a9", type: "renewal", title: "Trademark renewal - CloudSync Brand", dueDate: "2026-03-22", completed: false, organizationId: "org1", assetName: "CloudSync Brand" },
  { id: "10", assetId: "a10", type: "review", title: "Portfolio review - AI Model Suite", dueDate: "2026-04-05", completed: false, organizationId: "org1", assetName: "AI Model Suite" },
  { id: "11", assetId: "a11", type: "filing", title: "Design patent application - Ergonomic Controller", dueDate: "2026-04-12", completed: false, organizationId: "org1", assetName: "Ergonomic Controller" },
  { id: "12", assetId: "a12", type: "renewal", title: "Copyright registration renewal - DataViz Library", dueDate: "2026-02-20", completed: true, organizationId: "org1", assetName: "DataViz Library" },
  { id: "13", assetId: "a13", type: "response", title: "Opposition response filed - SecureAuth Protocol", dueDate: "2026-03-01", completed: true, organizationId: "org1", assetName: "SecureAuth Protocol" },
  { id: "14", assetId: "a14", type: "review", title: "Completed IP audit - Thermal Management System", dueDate: "2026-02-28", completed: true, organizationId: "org1", assetName: "Thermal Management System" },
];
