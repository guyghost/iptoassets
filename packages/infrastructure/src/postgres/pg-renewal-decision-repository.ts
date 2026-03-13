import { eq, and } from "drizzle-orm";
import type { AssetId, DeadlineId, RenewalDecisionId, OrganizationId } from "@ipms/shared";
import type { RenewalDecision, DecisionStatus, ScoreBreakdown } from "@ipms/domain";
import type { RenewalDecisionRepository } from "@ipms/application";
import { renewalDecisions } from "./schema.js";
import type { Database } from "./connection.js";

type RenewalDecisionRow = typeof renewalDecisions.$inferSelect;

function toEntity(row: RenewalDecisionRow): RenewalDecision {
  return {
    id: row.id as RenewalDecisionId,
    deadlineId: row.deadlineId as DeadlineId,
    assetId: row.assetId as AssetId,
    organizationId: row.organizationId as OrganizationId,
    estimatedCost: Number(row.estimatedCost),
    costOverride: row.costOverride ? Number(row.costOverride) : null,
    score: Number(row.score),
    scoreBreakdown: row.scoreBreakdown as ScoreBreakdown,
    decision: row.decision as DecisionStatus,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPgRenewalDecisionRepository(db: Database): RenewalDecisionRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.id, id), eq(renewalDecisions.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByDeadlineId(deadlineId, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.deadlineId, deadlineId), eq(renewalDecisions.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll(orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(eq(renewalDecisions.organizationId, orgId));
      return rows.map(toEntity);
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.assetId, assetId), eq(renewalDecisions.organizationId, orgId)));
      return rows.map(toEntity);
    },

    async save(decision) {
      await db.insert(renewalDecisions).values({
        id: decision.id,
        deadlineId: decision.deadlineId,
        assetId: decision.assetId,
        organizationId: decision.organizationId,
        estimatedCost: String(decision.estimatedCost),
        costOverride: decision.costOverride !== null ? String(decision.costOverride) : null,
        score: String(decision.score),
        scoreBreakdown: decision.scoreBreakdown,
        decision: decision.decision,
        decidedBy: decision.decidedBy,
        decidedAt: decision.decidedAt,
        notes: decision.notes,
      }).onConflictDoUpdate({
        target: renewalDecisions.id,
        set: {
          estimatedCost: String(decision.estimatedCost),
          costOverride: decision.costOverride !== null ? String(decision.costOverride) : null,
          score: String(decision.score),
          scoreBreakdown: decision.scoreBreakdown,
          decision: decision.decision,
          decidedBy: decision.decidedBy,
          decidedAt: decision.decidedAt,
          notes: decision.notes,
          updatedAt: new Date(),
        },
      });
    },

    async saveMany(decisions) {
      for (const decision of decisions) {
        await this.save(decision);
      }
    },
  };
}
