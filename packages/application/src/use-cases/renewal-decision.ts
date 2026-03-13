import type { AssetId, DeadlineId, OrganizationId, PortfolioId, RenewalDecisionId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { RenewalDecision, DecisionStatus, IPAsset, Deadline } from "@ipms/domain";
import { computeRenewalScore } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository, RenewalFeeRepository, RenewalDecisionRepository, PortfolioRepository } from "../ports.js";

export interface RenewalDecisionWithAsset extends RenewalDecision {
  readonly assetTitle: string;
  readonly assetJurisdiction: string;
  readonly deadlineTitle: string;
  readonly deadlineDueDate: Date;
}

// 1. listRenewalDecisionsUseCase — fetches all decisions enriched with asset/deadline info
export function listRenewalDecisionsUseCase(
  decisionRepo: RenewalDecisionRepository,
  assetRepo: AssetRepository,
  deadlineRepo: DeadlineRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<readonly RenewalDecisionWithAsset[]>> => {
    const [decisions, assets, deadlines] = await Promise.all([
      decisionRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      deadlineRepo.findAll(orgId),
    ]);
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const deadlineMap = new Map(deadlines.map((d) => [d.id, d]));
    const enriched = decisions.map((d) => {
      const asset = assetMap.get(d.assetId);
      const deadline = deadlineMap.get(d.deadlineId);
      return {
        ...d,
        assetTitle: asset?.title ?? "Unknown asset",
        assetJurisdiction: asset?.jurisdiction.code ?? "??",
        deadlineTitle: deadline?.title ?? "Unknown deadline",
        deadlineDueDate: deadline?.dueDate ?? new Date(),
      };
    });
    return ok(enriched);
  };
}

// 2. getRenewalDecisionUseCase
export function getRenewalDecisionUseCase(decisionRepo: RenewalDecisionRepository) {
  return async (id: RenewalDecisionId, orgId: OrganizationId): Promise<Result<RenewalDecision>> => {
    const decision = await decisionRepo.findById(id, orgId);
    if (!decision) return err("Renewal decision not found");
    return ok(decision);
  };
}

// 3. makeRenewalDecisionUseCase — user decides renew or abandon
export function makeRenewalDecisionUseCase(decisionRepo: RenewalDecisionRepository) {
  return async (
    id: RenewalDecisionId,
    orgId: OrganizationId,
    decision: "renew" | "abandon",
    decidedBy: string,
    notes: string | null,
  ): Promise<Result<RenewalDecision>> => {
    const existing = await decisionRepo.findById(id, orgId);
    if (!existing) return err("Renewal decision not found");
    const updated: RenewalDecision = {
      ...existing,
      decision,
      decidedBy,
      decidedAt: new Date(),
      notes,
      updatedAt: new Date(),
    };
    await decisionRepo.save(updated);
    return ok(updated);
  };
}

// 4. generateRenewalDecisionsUseCase — auto-generate pending decisions for renewal deadlines
export function generateRenewalDecisionsUseCase(
  deadlineRepo: DeadlineRepository,
  assetRepo: AssetRepository,
  feeRepo: RenewalFeeRepository,
  decisionRepo: RenewalDecisionRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<readonly RenewalDecision[]>> => {
    const [deadlines, assets, existingDecisions, allFees] = await Promise.all([
      deadlineRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      decisionRepo.findAll(orgId),
      feeRepo.findAll(),
    ]);

    const renewalDeadlines = deadlines.filter((d) => d.type === "renewal" && !d.completed);
    const existingDeadlineIds = new Set(existingDecisions.map((d) => d.deadlineId));
    const newDeadlines = renewalDeadlines.filter((d) => !existingDeadlineIds.has(d.id));
    if (newDeadlines.length === 0) return ok([]);

    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const allCosts = allFees.map((f) => f.officialFee + (f.typicalAgentFee ?? 0));
    const portfolioAvgCost = allCosts.length > 0
      ? allCosts.reduce((sum, c) => sum + c, 0) / allCosts.length
      : 1000;

    const created: RenewalDecision[] = [];

    for (const deadline of newDeadlines) {
      const asset = assetMap.get(deadline.assetId);
      if (!asset) continue;

      const maintenanceYear = asset.filingDate
        ? Math.max(3, Math.min(20, deadline.dueDate.getFullYear() - asset.filingDate.getFullYear()))
        : 4;
      const fee = await feeRepo.findByJurisdictionAndYear(asset.jurisdiction.code, maintenanceYear);

      const officialFee = fee?.officialFee ?? 0;
      const agentFee = fee?.typicalAgentFee ?? 0;
      const estimatedCost = officialFee + agentFee;

      const patentAgeYears = asset.filingDate
        ? Math.max(0, new Date().getFullYear() - asset.filingDate.getFullYear())
        : 10;

      const citingPatents = asset.metadata?.citingPatents;
      const citingCount = Array.isArray(citingPatents) ? citingPatents.length : 0;

      const pubs = asset.metadata?.publications;
      const jurisdictionCount = Array.isArray(pubs)
        ? Math.max(1, new Set((pubs as Array<Record<string, unknown>>).map((p) => p.country).filter(Boolean)).size)
        : 1;

      const { score, breakdown } = computeRenewalScore({
        renewalCost: estimatedCost,
        portfolioAvgCost,
        citingPatentsCount: citingCount,
        jurisdictionCount,
        patentAgeYears,
        maxPatentAge: 20,
      });

      const decision: RenewalDecision = {
        id: crypto.randomUUID() as RenewalDecisionId,
        deadlineId: deadline.id,
        assetId: deadline.assetId,
        organizationId: orgId,
        estimatedCost,
        costOverride: null,
        score,
        scoreBreakdown: breakdown,
        decision: "pending" as const,
        decidedBy: null,
        decidedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      created.push(decision);
    }

    if (created.length > 0) {
      await decisionRepo.saveMany(created);
    }
    return ok(created);
  };
}

// 5. getPortfolioFinancialsUseCase
export interface PortfolioFinancials {
  readonly totalAnnualCost: number;
  readonly totalPendingCost: number;
  readonly renewedCount: number;
  readonly abandonedCount: number;
  readonly pendingCount: number;
  readonly savedByAbandoning: number;
  readonly costByJurisdiction: Record<string, number>;
  readonly decisions: readonly RenewalDecisionWithAsset[];
}

export function getPortfolioFinancialsUseCase(
  portfolioRepo: PortfolioRepository,
  assetRepo: AssetRepository,
  decisionRepo: RenewalDecisionRepository,
  deadlineRepo: DeadlineRepository,
) {
  return async (portfolioId: PortfolioId, orgId: OrganizationId): Promise<Result<PortfolioFinancials>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const [allDecisions, allAssets, allDeadlines] = await Promise.all([
      decisionRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      deadlineRepo.findAll(orgId),
    ]);

    const portfolioAssetIds = new Set(portfolio.assetIds);
    const decisions = allDecisions.filter((d) => portfolioAssetIds.has(d.assetId));
    const assetMap = new Map(allAssets.map((a) => [a.id, a]));
    const deadlineMap = new Map(allDeadlines.map((d) => [d.id, d]));

    const enrichedDecisions: RenewalDecisionWithAsset[] = decisions.map((d) => {
      const asset = assetMap.get(d.assetId);
      const deadline = deadlineMap.get(d.deadlineId);
      return {
        ...d,
        assetTitle: asset?.title ?? "Unknown",
        assetJurisdiction: asset?.jurisdiction.code ?? "??",
        deadlineTitle: deadline?.title ?? "Unknown",
        deadlineDueDate: deadline?.dueDate ?? new Date(),
      };
    });

    const costByJurisdiction: Record<string, number> = {};
    let totalAnnualCost = 0;
    let totalPendingCost = 0;
    let savedByAbandoning = 0;

    for (const d of decisions) {
      const cost = d.costOverride ?? d.estimatedCost;
      const jurisdiction = assetMap.get(d.assetId)?.jurisdiction.code ?? "Other";
      if (d.decision === "renew") {
        totalAnnualCost += cost;
        costByJurisdiction[jurisdiction] = (costByJurisdiction[jurisdiction] ?? 0) + cost;
      } else if (d.decision === "pending") {
        totalPendingCost += cost;
        costByJurisdiction[jurisdiction] = (costByJurisdiction[jurisdiction] ?? 0) + cost;
      } else if (d.decision === "abandon") {
        savedByAbandoning += cost;
      }
    }

    return ok({
      totalAnnualCost,
      totalPendingCost,
      renewedCount: decisions.filter((d) => d.decision === "renew").length,
      abandonedCount: decisions.filter((d) => d.decision === "abandon").length,
      pendingCount: decisions.filter((d) => d.decision === "pending").length,
      savedByAbandoning,
      costByJurisdiction,
      decisions: enrichedDecisions,
    });
  };
}

// 6. projectPortfolioCostsUseCase
export interface CostProjection {
  readonly year: number;
  readonly totalCost: number;
  readonly byJurisdiction: Record<string, number>;
}

export function projectPortfolioCostsUseCase(
  portfolioRepo: PortfolioRepository,
  assetRepo: AssetRepository,
  feeRepo: RenewalFeeRepository,
) {
  return async (
    portfolioId: PortfolioId,
    orgId: OrganizationId,
    years: number = 5,
  ): Promise<Result<readonly CostProjection[]>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const allAssets = await assetRepo.findAll(orgId);
    const portfolioAssets = allAssets.filter((a) => portfolio.assetIds.includes(a.id));
    const activeAssets = portfolioAssets.filter((a) => a.status === "granted" || a.status === "filed" || a.status === "published");

    const currentYear = new Date().getFullYear();
    const projections: CostProjection[] = [];

    for (let y = 0; y < years; y++) {
      const projYear = currentYear + y;
      const byJurisdiction: Record<string, number> = {};
      let totalCost = 0;

      for (const asset of activeAssets) {
        const filingYear = asset.filingDate?.getFullYear() ?? currentYear;
        const maintenanceYear = Math.max(3, projYear - filingYear);
        if (maintenanceYear > 20) continue;

        const fee = await feeRepo.findByJurisdictionAndYear(asset.jurisdiction.code, maintenanceYear);
        const cost = (fee?.officialFee ?? 0) + (fee?.typicalAgentFee ?? 0);
        totalCost += cost;
        byJurisdiction[asset.jurisdiction.code] = (byJurisdiction[asset.jurisdiction.code] ?? 0) + cost;
      }
      projections.push({ year: projYear, totalCost, byJurisdiction });
    }
    return ok(projections);
  };
}
