export interface Portfolio {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
  owner: string;
  organizationId: string;
}

export const portfolios: Portfolio[] = [
  {
    id: "p1",
    name: "Core Patents",
    description: "Strategic patent portfolio covering our foundational technologies including neural interfaces, quantum computing architectures, and advanced display systems.",
    assetIds: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11", "a12"],
    owner: "Alex Chen",
    organizationId: "org1",
  },
  {
    id: "p2",
    name: "Brand Assets",
    description: "Trademark registrations and brand identity assets across key markets including US, EU, and APAC regions.",
    assetIds: ["a20", "a21", "a22", "a23", "a24"],
    owner: "Maria Lopez",
    organizationId: "org1",
  },
  {
    id: "p3",
    name: "Software Copyrights",
    description: "Copyright registrations for proprietary software, training datasets, and documentation materials.",
    assetIds: ["a30", "a31", "a32"],
    owner: "James Park",
    organizationId: "org1",
  },
  {
    id: "p4",
    name: "Licensing Portfolio",
    description: "Assets available for out-licensing or currently under licensing agreements with third parties.",
    assetIds: ["a1", "a4", "a7", "a10", "a20", "a21", "a30"],
    owner: "Sarah Kim",
    organizationId: "org1",
  },
  {
    id: "p5",
    name: "APAC Filings",
    description: "Regional portfolio covering all intellectual property filings across Asia-Pacific jurisdictions including Japan, Korea, China, and Australia.",
    assetIds: ["a40", "a41", "a42", "a43", "a44", "a45", "a46", "a47", "a48"],
    owner: "Wei Zhang",
    organizationId: "org1",
  },
  {
    id: "p6",
    name: "R&D Pipeline",
    description: "Emerging inventions and provisional patent applications from the research and development team.",
    assetIds: ["a50", "a51"],
    owner: "Alex Chen",
    organizationId: "org1",
  },
];

export interface PortfolioAsset {
  id: string;
  title: string;
  type: string;
  jurisdiction: string;
  status: string;
  filingDate: string;
}

export const mockPortfolios = [
  {
    id: "p1",
    name: "Core Patents",
    description: "Strategic patent portfolio covering our foundational technologies including neural interfaces, quantum computing architectures, and advanced display systems. This portfolio represents the company's most valuable IP assets and is central to our competitive positioning.",
    assetIds: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11", "a12"],
    owner: "Alex Chen",
    organizationId: "org1",
  },
  {
    id: "p2",
    name: "Brand Assets",
    description: "Trademark registrations and brand identity assets across key markets including US, EU, and APAC regions. Covers primary brand marks, product names, and logo registrations.",
    assetIds: ["a20", "a21", "a22", "a23", "a24"],
    owner: "Maria Lopez",
    organizationId: "org1",
  },
  {
    id: "p3",
    name: "Software Copyrights",
    description: "Copyright registrations for proprietary software, training datasets, and documentation materials.",
    assetIds: ["a30", "a31", "a32"],
    owner: "James Park",
    organizationId: "org1",
  },
  {
    id: "p4",
    name: "Licensing Portfolio",
    description: "Assets available for out-licensing or currently under licensing agreements with third parties.",
    assetIds: ["a1", "a4", "a7", "a10", "a20", "a21", "a30"],
    owner: "Sarah Kim",
    organizationId: "org1",
  },
  {
    id: "p5",
    name: "APAC Filings",
    description: "Regional portfolio covering all intellectual property filings across Asia-Pacific jurisdictions including Japan, Korea, China, and Australia.",
    assetIds: ["a40", "a41", "a42", "a43", "a44", "a45", "a46", "a47", "a48"],
    owner: "Wei Zhang",
    organizationId: "org1",
  },
  {
    id: "p6",
    name: "R&D Pipeline",
    description: "Emerging inventions and provisional patent applications from the research and development team.",
    assetIds: ["a50", "a51"],
    owner: "Alex Chen",
    organizationId: "org1",
  },
];

export const mockAssets: PortfolioAsset[] = [
  { id: "a1", title: "Neural Interface Patent", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Jan 15, 2024" },
  { id: "a2", title: "Quantum Gate Architecture", type: "Patent", jurisdiction: "US", status: "Filed", filingDate: "Mar 22, 2024" },
  { id: "a3", title: "Holographic Display Method", type: "Patent", jurisdiction: "JP", status: "Published", filingDate: "May 10, 2024" },
  { id: "a4", title: "AI Training Optimization", type: "Patent", jurisdiction: "EU", status: "Granted", filingDate: "Jul 3, 2024" },
  { id: "a5", title: "Secure Data Pipeline", type: "Patent", jurisdiction: "US", status: "Filed", filingDate: "Aug 18, 2024" },
  { id: "a6", title: "Edge Computing Protocol", type: "Patent", jurisdiction: "KR", status: "Draft", filingDate: "Sep 5, 2024" },
  { id: "a7", title: "Biometric Auth System", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Oct 12, 2024" },
  { id: "a8", title: "Natural Language Processor", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Nov 20, 2024" },
  { id: "a9", title: "Wireless Charging Module", type: "Patent", jurisdiction: "US", status: "Published", filingDate: "Dec 1, 2024" },
  { id: "a10", title: "Autonomous Navigation", type: "Patent", jurisdiction: "DE", status: "Filed", filingDate: "Jan 8, 2025" },
  { id: "a11", title: "Sensor Fusion Algorithm", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Feb 14, 2025" },
  { id: "a12", title: "Cloud Orchestration", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Mar 1, 2025" },
  { id: "a20", title: "Quantum Logo Mark", type: "Trademark", jurisdiction: "US", status: "Granted", filingDate: "Feb 10, 2024" },
  { id: "a21", title: "NeuraLink Word Mark", type: "Trademark", jurisdiction: "EU", status: "Granted", filingDate: "Apr 5, 2024" },
  { id: "a22", title: "QBit Brand Identity", type: "Trademark", jurisdiction: "JP", status: "Filed", filingDate: "Jun 18, 2024" },
  { id: "a23", title: "Holo Display Mark", type: "Trademark", jurisdiction: "US", status: "Published", filingDate: "Aug 22, 2024" },
  { id: "a24", title: "CloudSync Logo", type: "Trademark", jurisdiction: "AU", status: "Draft", filingDate: "Oct 30, 2024" },
  { id: "a30", title: "AI Training Dataset", type: "Copyright", jurisdiction: "US", status: "Granted", filingDate: "Mar 12, 2024" },
  { id: "a31", title: "Platform Source Code", type: "Copyright", jurisdiction: "US", status: "Granted", filingDate: "May 20, 2024" },
  { id: "a32", title: "Technical Documentation", type: "Copyright", jurisdiction: "US", status: "Filed", filingDate: "Jul 15, 2024" },
  { id: "a40", title: "Robotics Control System", type: "Patent", jurisdiction: "JP", status: "Filed", filingDate: "Jan 20, 2025" },
  { id: "a41", title: "Smart Grid Patent", type: "Patent", jurisdiction: "KR", status: "Granted", filingDate: "Feb 8, 2025" },
  { id: "a42", title: "AR Display Technology", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Mar 15, 2025" },
  { id: "a43", title: "Voice Recognition Engine", type: "Patent", jurisdiction: "JP", status: "Published", filingDate: "Apr 2, 2025" },
  { id: "a44", title: "Battery Optimization", type: "Patent", jurisdiction: "AU", status: "Filed", filingDate: "May 10, 2025" },
  { id: "a45", title: "Data Compression Method", type: "Patent", jurisdiction: "KR", status: "Draft", filingDate: "Jun 22, 2025" },
  { id: "a46", title: "Haptic Feedback Device", type: "Patent", jurisdiction: "JP", status: "Granted", filingDate: "Jul 30, 2025" },
  { id: "a47", title: "Network Security Protocol", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Aug 15, 2025" },
  { id: "a48", title: "Image Processing Chip", type: "Patent", jurisdiction: "AU", status: "Published", filingDate: "Sep 5, 2025" },
  { id: "a50", title: "Quantum Error Correction", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Jan 5, 2026" },
  { id: "a51", title: "Neural Mesh Interface v2", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Feb 18, 2026" },
];
