import { eq, and } from "drizzle-orm";
import type { RenewalFeeId } from "@ipms/shared";
import type { RenewalFee } from "@ipms/domain";
import type { RenewalFeeRepository } from "@ipms/application";
import { renewalFees } from "./schema.js";
import type { Database } from "./connection.js";

type RenewalFeeRow = typeof renewalFees.$inferSelect;

function toEntity(row: RenewalFeeRow): RenewalFee {
  return {
    id: row.id as RenewalFeeId,
    jurisdictionCode: row.jurisdictionCode,
    year: row.year,
    officialFee: Number(row.officialFee),
    typicalAgentFee: row.typicalAgentFee ? Number(row.typicalAgentFee) : null,
    currency: row.currency,
    officialFeeLocal: Number(row.officialFeeLocal),
    updatedAt: row.updatedAt,
  };
}

export function createPgRenewalFeeRepository(db: Database): RenewalFeeRepository {
  return {
    async findByJurisdiction(jurisdictionCode) {
      const rows = await db.select().from(renewalFees)
        .where(eq(renewalFees.jurisdictionCode, jurisdictionCode));
      return rows.map(toEntity);
    },

    async findByJurisdictionAndYear(jurisdictionCode, year) {
      const rows = await db.select().from(renewalFees)
        .where(and(eq(renewalFees.jurisdictionCode, jurisdictionCode), eq(renewalFees.year, year)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll() {
      const rows = await db.select().from(renewalFees);
      return rows.map(toEntity);
    },

    async save(fee) {
      await db.insert(renewalFees).values({
        id: fee.id,
        jurisdictionCode: fee.jurisdictionCode,
        year: fee.year,
        officialFee: String(fee.officialFee),
        typicalAgentFee: fee.typicalAgentFee !== null ? String(fee.typicalAgentFee) : null,
        currency: fee.currency,
        officialFeeLocal: String(fee.officialFeeLocal),
      }).onConflictDoUpdate({
        target: renewalFees.id,
        set: {
          jurisdictionCode: fee.jurisdictionCode,
          year: fee.year,
          officialFee: String(fee.officialFee),
          typicalAgentFee: fee.typicalAgentFee !== null ? String(fee.typicalAgentFee) : null,
          currency: fee.currency,
          officialFeeLocal: String(fee.officialFeeLocal),
          updatedAt: new Date(),
        },
      });
    },

    async saveMany(fees) {
      for (const fee of fees) {
        await this.save(fee);
      }
    },
  };
}
