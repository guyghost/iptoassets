import type { RenewalFee } from "@ipms/domain";
import type { RenewalFeeRepository } from "@ipms/application";

export function createInMemoryRenewalFeeRepository(): RenewalFeeRepository {
  const store = new Map<string, RenewalFee>();

  return {
    async findByJurisdiction(jurisdictionCode) {
      return [...store.values()].filter((f) => f.jurisdictionCode === jurisdictionCode);
    },

    async findByJurisdictionAndYear(jurisdictionCode, year) {
      return [...store.values()].find(
        (f) => f.jurisdictionCode === jurisdictionCode && f.year === year,
      ) ?? null;
    },

    async findAll() {
      return [...store.values()];
    },

    async save(fee) {
      store.set(fee.id, fee);
    },

    async saveMany(fees) {
      for (const fee of fees) {
        store.set(fee.id, fee);
      }
    },
  };
}
