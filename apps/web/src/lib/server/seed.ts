import { createAsset, createDeadline, createDocument, createPortfolio, createStatusChangeEvent, createUser, createOrganization, createMembership } from "@ipms/domain";
import type { AssetId, DeadlineId, DocumentId, PortfolioId, StatusChangeEventId, AssetStatus, UserId, MembershipId } from "@ipms/shared";
import { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo, userRepo, orgRepo, memberRepo } from "./repositories.js";
import type { OrganizationId } from "@ipms/shared";

const SEED_ORG_ID = "00000000-0000-0000-0000-000000000001" as OrganizationId;
const SEED_USER_ID = "00000000-0000-0000-0000-000000000099" as UserId;

function uuid() {
  return crypto.randomUUID();
}

// Pre-generate asset IDs so we can reference them in deadlines, documents, etc.
const assetIds = {
  neuralInterface: uuid() as AssetId,
  quantumLogo: uuid() as AssetId,
  aiTrainingDataset: uuid() as AssetId,
  holographicDisplay: uuid() as AssetId,
  bioSyncDesign: uuid() as AssetId,
  smartGridPatent: uuid() as AssetId,
  ecoFlowBrand: uuid() as AssetId,
  adaptiveUi: uuid() as AssetId,
  nanoFilter: uuid() as AssetId,
  aeroLensDesign: uuid() as AssetId,
};

const statusTransitionPaths: Record<string, { statuses: AssetStatus[]; dates: Date[] }> = {
  // filed
  [assetIds.neuralInterface]: {
    statuses: ["filed"],
    dates: [new Date("2026-01-20")],
  },
  // granted (draft -> filed -> published -> granted)
  [assetIds.quantumLogo]: {
    statuses: ["filed", "published", "granted"],
    dates: [new Date("2025-06-25"), new Date("2025-09-10"), new Date("2025-12-01")],
  },
  // draft — no transitions
  // published (draft -> filed -> published)
  [assetIds.holographicDisplay]: {
    statuses: ["filed", "published"],
    dates: [new Date("2025-09-15"), new Date("2026-01-10")],
  },
  // granted (draft -> filed -> granted)
  [assetIds.bioSyncDesign]: {
    statuses: ["filed", "granted"],
    dates: [new Date("2025-03-20"), new Date("2025-08-15")],
  },
  // expired (draft -> filed -> granted -> expired)
  [assetIds.smartGridPatent]: {
    statuses: ["filed", "granted", "expired"],
    dates: [new Date("2006-05-01"), new Date("2007-02-15"), new Date("2026-02-01")],
  },
  // filed
  [assetIds.ecoFlowBrand]: {
    statuses: ["filed"],
    dates: [new Date("2026-02-12")],
  },
  // granted (draft -> filed -> granted)
  [assetIds.adaptiveUi]: {
    statuses: ["filed", "granted"],
    dates: [new Date("2025-11-10"), new Date("2026-01-05")],
  },
  // abandoned (draft -> filed -> abandoned)
  [assetIds.nanoFilter]: {
    statuses: ["filed", "abandoned"],
    dates: [new Date("2024-08-20"), new Date("2025-12-01")],
  },
  // filed
  [assetIds.aeroLensDesign]: {
    statuses: ["filed"],
    dates: [new Date("2026-02-01")],
  },
};

async function seedRenewalFees() {
  const { renewalFeeRepo } = await import("./repositories.js");
  const existingFees = await renewalFeeRepo.findAll();
  if (existingFees.length > 0) return;

  const { generateRenewalFees } = await import("./renewal-fee-seed.js");
  const fees = generateRenewalFees();
  await renewalFeeRepo.saveMany(fees);
  console.log(`[seed] Created ${fees.length} renewal fee entries`);
}

export async function seedData() {
  // Seed renewal fees (org-independent, idempotent)
  await seedRenewalFees();

  const orgId = SEED_ORG_ID;

  // --- Dev User + Organization (idempotent) ---
  let userId = SEED_USER_ID;

  // Check if user already exists (may have been created by signInOrRegister with a different ID)
  const existingUser = await userRepo.findByEmail("dev@ipms.local");
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const userResult = createUser({
      id: SEED_USER_ID,
      email: "dev@ipms.local",
      name: "Dev User",
      avatarUrl: null,
      authProviderId: "dev-login:dev@ipms.local",
    });
    if (userResult.ok) await userRepo.save(userResult.value);
  }

  // Create org if it doesn't exist
  const existingOrg = await orgRepo.findById(orgId);
  if (!existingOrg) {
    const orgResult = createOrganization({
      id: orgId,
      name: "Dev Organization",
      ownerId: userId,
    });
    if (orgResult.ok) await orgRepo.save(orgResult.value);
  }

  // Create membership if it doesn't exist
  const existingMember = await memberRepo.findByUserAndOrg(userId, orgId);
  if (!existingMember) {
    const memberResult = createMembership({
      id: uuid() as MembershipId,
      userId,
      organizationId: orgId,
      role: "admin",
    });
    if (memberResult.ok) await memberRepo.save(memberResult.value);
  }

  // Seed deadlines for any org that has assets but no deadlines
  await seedDeadlinesForAllOrgs();

  // Skip asset seeding if org already has assets
  const existingAssets = await assetRepo.findAll(orgId);
  if (existingAssets.length > 0) return;

  // --- Assets ---
  const assetInputs = [
    { id: assetIds.neuralInterface, title: "Neural Interface Patent", type: "patent" as const, jurisdiction: { code: "US", name: "United States" }, owner: "Alex Chen", filingDate: new Date("2026-01-15"), expirationDate: new Date("2046-01-15") },
    { id: assetIds.quantumLogo, title: "Quantum Logo Mark", type: "trademark" as const, jurisdiction: { code: "EU", name: "European Union" }, owner: "Sarah Kim", filingDate: new Date("2025-06-20"), expirationDate: new Date("2035-06-20") },
    { id: assetIds.aiTrainingDataset, title: "AI Training Dataset", type: "copyright" as const, jurisdiction: { code: "US", name: "United States" }, owner: "Alex Chen", filingDate: null, expirationDate: null },
    { id: assetIds.holographicDisplay, title: "Holographic Display", type: "patent" as const, jurisdiction: { code: "JP", name: "Japan" }, owner: "Takeshi Yamamoto", filingDate: new Date("2025-09-10"), expirationDate: new Date("2045-09-10") },
    { id: assetIds.bioSyncDesign, title: "BioSync Wearable Design", type: "design-right" as const, jurisdiction: { code: "GB", name: "United Kingdom" }, owner: "Emma Watson", filingDate: new Date("2025-03-12"), expirationDate: new Date("2040-03-12") },
    { id: assetIds.smartGridPatent, title: "SmartGrid Energy Patent", type: "patent" as const, jurisdiction: { code: "DE", name: "Germany" }, owner: "Hans Mueller", filingDate: new Date("2006-04-22"), expirationDate: new Date("2026-04-22") },
    { id: assetIds.ecoFlowBrand, title: "EcoFlow Brand Identity", type: "trademark" as const, jurisdiction: { code: "US", name: "United States" }, owner: "Sarah Kim", filingDate: new Date("2026-02-10"), expirationDate: new Date("2036-02-10") },
    { id: assetIds.adaptiveUi, title: "Adaptive UI Framework", type: "copyright" as const, jurisdiction: { code: "EU", name: "European Union" }, owner: "Alex Chen", filingDate: new Date("2025-11-05"), expirationDate: new Date("2095-11-05") },
    { id: assetIds.nanoFilter, title: "NanoFilter Membrane", type: "patent" as const, jurisdiction: { code: "CN", name: "China" }, owner: "Li Wei", filingDate: new Date("2024-08-15"), expirationDate: null },
    { id: assetIds.aeroLensDesign, title: "AeroLens Optics Design", type: "design-right" as const, jurisdiction: { code: "KR", name: "South Korea" }, owner: "Ji-Hoon Park", filingDate: new Date("2026-01-28"), expirationDate: new Date("2041-01-28") },
  ];

  for (const input of assetInputs) {
    const result = createAsset({
      id: input.id,
      title: input.title,
      type: input.type,
      jurisdiction: input.jurisdiction,
      owner: input.owner,
      organizationId: orgId,
    });

    if (!result.ok) continue;

    // createAsset sets status to "draft" and dates to null. We need to patch the entity
    // to set the correct status, filing date, and expiration date for seeding purposes.
    const transitions = statusTransitionPaths[input.id];
    const finalStatus: AssetStatus = transitions
      ? transitions.statuses[transitions.statuses.length - 1]
      : "draft";

    const asset = {
      ...result.value,
      status: finalStatus,
      filingDate: input.filingDate,
      expirationDate: input.expirationDate,
    };

    await assetRepo.save(asset);

    // --- StatusChangeEvents for non-draft assets ---
    if (transitions) {
      let fromStatus: AssetStatus | null = "draft";
      for (let i = 0; i < transitions.statuses.length; i++) {
        const eventResult = createStatusChangeEvent({
          id: uuid() as StatusChangeEventId,
          assetId: input.id,
          fromStatus,
          toStatus: transitions.statuses[i],
          changedBy: input.owner,
          organizationId: orgId,
        });
        if (eventResult.ok) {
          // Override changedAt with the historical date
          const event = { ...eventResult.value, changedAt: transitions.dates[i] };
          await statusChangeEventRepo.save(event);
        }
        fromStatus = transitions.statuses[i];
      }
    }
  }

  // --- Deadlines ---
  const deadlineInputs: Array<{
    assetId: AssetId;
    type: "renewal" | "response" | "filing" | "review" | "custom";
    title: string;
    dueDate: Date;
    completed: boolean;
  }> = [
    // Overdue (past dates, not completed)
    { assetId: assetIds.neuralInterface, type: "response", title: "Office action response - Neural Interface Patent", dueDate: new Date("2026-03-05"), completed: false },
    { assetId: assetIds.quantumLogo, type: "renewal", title: "Annual renewal fee - Quantum Logo Mark", dueDate: new Date("2026-03-03"), completed: false },
    { assetId: assetIds.holographicDisplay, type: "filing", title: "PCT national phase entry - Holographic Display", dueDate: new Date("2026-03-07"), completed: false },
    // Upcoming (near-future dates)
    { assetId: assetIds.bioSyncDesign, type: "renewal", title: "Maintenance fee payment - BioSync Wearable Design", dueDate: new Date("2026-03-15"), completed: false },
    { assetId: assetIds.ecoFlowBrand, type: "review", title: "Prior art review - EcoFlow Brand Identity", dueDate: new Date("2026-03-18"), completed: false },
    { assetId: assetIds.adaptiveUi, type: "response", title: "Examiner interview preparation - Adaptive UI Framework", dueDate: new Date("2026-03-22"), completed: false },
    { assetId: assetIds.aeroLensDesign, type: "filing", title: "Provisional application filing - AeroLens Optics Design", dueDate: new Date("2026-03-28"), completed: false },
    { assetId: assetIds.smartGridPatent, type: "custom", title: "Expiration review - SmartGrid Energy Patent", dueDate: new Date("2026-04-15"), completed: false },
    { assetId: assetIds.neuralInterface, type: "renewal", title: "Trademark renewal - Neural Interface Patent", dueDate: new Date("2026-04-22"), completed: false },
    { assetId: assetIds.holographicDisplay, type: "review", title: "Portfolio review - Holographic Display", dueDate: new Date("2026-05-05"), completed: false },
    // Completed
    { assetId: assetIds.adaptiveUi, type: "renewal", title: "Copyright registration renewal - Adaptive UI Framework", dueDate: new Date("2026-02-20"), completed: true },
    { assetId: assetIds.quantumLogo, type: "response", title: "Opposition response filed - Quantum Logo Mark", dueDate: new Date("2026-03-01"), completed: true },
    { assetId: assetIds.bioSyncDesign, type: "review", title: "Completed IP audit - BioSync Wearable Design", dueDate: new Date("2026-02-28"), completed: true },
    { assetId: assetIds.nanoFilter, type: "filing", title: "Abandonment paperwork filed - NanoFilter Membrane", dueDate: new Date("2025-12-15"), completed: true },
  ];

  for (const input of deadlineInputs) {
    const result = createDeadline({
      id: uuid() as DeadlineId,
      assetId: input.assetId,
      type: input.type,
      title: input.title,
      dueDate: input.dueDate,
      organizationId: orgId,
    });

    if (!result.ok) continue;

    const deadline = input.completed ? { ...result.value, completed: true } : result.value;
    await deadlineRepo.save(deadline);
  }

  // --- Documents ---
  const documentInputs = [
    { assetId: assetIds.neuralInterface, name: "Patent Application Draft", type: "filing" as const, url: "/docs/neural-interface-application.pdf" },
    { assetId: assetIds.neuralInterface, name: "Prior Art Search Report", type: "evidence" as const, url: "/docs/neural-interface-prior-art.pdf" },
    { assetId: assetIds.quantumLogo, name: "Trademark Registration Certificate", type: "certificate" as const, url: "/docs/quantum-logo-certificate.pdf" },
    { assetId: assetIds.holographicDisplay, name: "PCT Filing Receipt", type: "filing" as const, url: "/docs/holographic-display-pct.pdf" },
    { assetId: assetIds.bioSyncDesign, name: "Design Drawings", type: "correspondence" as const, url: "/docs/biosync-design-drawings.pdf" },
    { assetId: assetIds.smartGridPatent, name: "Grant Certificate", type: "certificate" as const, url: "/docs/smartgrid-grant.pdf" },
  ];

  for (const input of documentInputs) {
    const result = createDocument({
      id: uuid() as DocumentId,
      assetId: input.assetId,
      name: input.name,
      type: input.type,
      url: input.url,
      organizationId: orgId,
    });

    if (result.ok) {
      await documentRepo.save(result.value);
    }
  }

  // --- Portfolios ---
  const portfolioInputs = [
    { name: "Core Technology Patents", description: "Key patents covering core technology innovations", owner: "Alex Chen", assetIds: [assetIds.neuralInterface, assetIds.holographicDisplay, assetIds.smartGridPatent] },
    { name: "Brand Assets", description: "Trademarks and brand identity assets", owner: "Sarah Kim", assetIds: [assetIds.quantumLogo, assetIds.ecoFlowBrand] },
    { name: "Design Portfolio", description: "Industrial and product design rights", owner: "Emma Watson", assetIds: [assetIds.bioSyncDesign, assetIds.aeroLensDesign] },
  ];

  for (const input of portfolioInputs) {
    const result = createPortfolio({
      id: uuid() as PortfolioId,
      name: input.name,
      description: input.description,
      owner: input.owner,
      organizationId: orgId,
    });

    if (result.ok) {
      const portfolio = { ...result.value, assetIds: input.assetIds };
      await portfolioRepo.save(portfolio);
    }
  }
}

/**
 * For any organization that has assets but no deadlines, generate
 * realistic deadlines based on the actual assets in that org.
 */
async function seedDeadlinesForAllOrgs() {
  const orgs = await orgRepo.findAll();
  const now = new Date();

  for (const org of orgs) {
    const existingDeadlines = await deadlineRepo.findAll(org.id);
    if (existingDeadlines.length > 0) continue;

    const assets = await assetRepo.findAll(org.id);
    if (assets.length === 0) continue;

    const deadlineTypes: Array<"renewal" | "response" | "filing" | "review" | "custom"> =
      ["renewal", "response", "filing", "review", "custom"];

    const titleTemplates: Record<string, (assetTitle: string) => string> = {
      renewal: (t) => `Renewal fee payment - ${t}`,
      response: (t) => `Office action response - ${t}`,
      filing: (t) => `Filing deadline - ${t}`,
      review: (t) => `Portfolio review - ${t}`,
      custom: (t) => `Administrative review - ${t}`,
    };

    // Pick a subset of assets for deadlines (up to 14)
    const selected = assets.slice(0, Math.min(assets.length, 14));
    const deadlines: Array<{
      assetId: AssetId;
      type: "renewal" | "response" | "filing" | "review" | "custom";
      title: string;
      dueDate: Date;
      completed: boolean;
    }> = [];

    for (let i = 0; i < selected.length; i++) {
      const asset = selected[i];
      const type = deadlineTypes[i % deadlineTypes.length];
      const shortTitle = asset.title.split("\n")[0].slice(0, 80);
      const template = titleTemplates[type];

      // Spread deadlines: some overdue, some this week, some upcoming, some completed
      let dueDate: Date;
      let completed = false;

      if (i < 3) {
        // Overdue (3-10 days ago)
        dueDate = new Date(now.getTime() - (3 + i * 3) * 86_400_000);
      } else if (i < 6) {
        // Due this week (1-5 days from now)
        dueDate = new Date(now.getTime() + (1 + (i - 3) * 2) * 86_400_000);
      } else if (i < 10) {
        // Upcoming (2-6 weeks from now)
        dueDate = new Date(now.getTime() + (14 + (i - 6) * 10) * 86_400_000);
      } else {
        // Completed (past dates)
        dueDate = new Date(now.getTime() - (15 + (i - 10) * 7) * 86_400_000);
        completed = true;
      }

      deadlines.push({
        assetId: asset.id,
        type,
        title: template(shortTitle),
        dueDate,
        completed,
      });
    }

    for (const input of deadlines) {
      const result = createDeadline({
        id: uuid() as DeadlineId,
        assetId: input.assetId,
        type: input.type,
        title: input.title,
        dueDate: input.dueDate,
        organizationId: org.id,
      });

      if (!result.ok) continue;
      const deadline = input.completed ? { ...result.value, completed: true } : result.value;
      await deadlineRepo.save(deadline);
    }
  }
}
