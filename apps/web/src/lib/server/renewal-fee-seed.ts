import type { RenewalFeeId } from "@ipms/shared";
import type { RenewalFee } from "@ipms/domain";

interface FeeSchedule {
  jurisdiction: string;
  currency: string;
  // Map from maintenance year to [officialFeeEUR, agentFeeEUR, officialFeeLocal]
  fees: Record<number, [number, number, number]>;
}

const SCHEDULES: FeeSchedule[] = [
  {
    jurisdiction: "EP",
    currency: "EUR",
    fees: {
      3: [470, 150, 470], 4: [585, 150, 585], 5: [810, 150, 810], 6: [925, 150, 925],
      7: [1040, 150, 1040], 8: [1155, 150, 1155], 9: [1270, 150, 1270], 10: [1575, 150, 1575],
      11: [1575, 150, 1575], 12: [1575, 150, 1575], 13: [1575, 150, 1575], 14: [1575, 150, 1575],
      15: [1575, 150, 1575], 16: [1575, 150, 1575], 17: [1575, 150, 1575], 18: [1575, 150, 1575],
      19: [1575, 150, 1575], 20: [1575, 150, 1575],
    },
  },
  {
    jurisdiction: "US",
    currency: "USD",
    fees: {
      3: [1600, 200, 1700], 4: [1600, 200, 1700], 5: [1600, 200, 1700], 6: [1600, 200, 1700],
      7: [1600, 200, 1700], 8: [3600, 200, 3800], 9: [3600, 200, 3800], 10: [3600, 200, 3800],
      11: [3600, 200, 3800], 12: [3600, 200, 3800], 13: [7400, 200, 7800], 14: [7400, 200, 7800],
      15: [7400, 200, 7800], 16: [7400, 200, 7800], 17: [7400, 200, 7800], 18: [7400, 200, 7800],
      19: [7400, 200, 7800], 20: [7400, 200, 7800],
    },
  },
  {
    jurisdiction: "JP",
    currency: "JPY",
    fees: {
      3: [200, 180, 32900], 4: [600, 180, 98600], 5: [600, 180, 98600], 6: [600, 180, 98600],
      7: [900, 180, 148100], 8: [900, 180, 148100], 9: [900, 180, 148100], 10: [1200, 180, 197400],
      11: [1200, 180, 197400], 12: [1200, 180, 197400], 13: [1500, 180, 246800], 14: [1500, 180, 246800],
      15: [1500, 180, 246800], 16: [1800, 180, 296200], 17: [1800, 180, 296200], 18: [1800, 180, 296200],
      19: [2100, 180, 345600], 20: [2100, 180, 345600],
    },
  },
  {
    jurisdiction: "CN",
    currency: "CNY",
    fees: {
      3: [80, 120, 600], 4: [100, 120, 800], 5: [120, 120, 1000], 6: [140, 120, 1200],
      7: [180, 120, 1400], 8: [200, 120, 1600], 9: [250, 120, 2000], 10: [300, 120, 2500],
      11: [350, 120, 3000], 12: [400, 120, 3500], 13: [450, 120, 4000], 14: [500, 120, 4500],
      15: [550, 120, 5000], 16: [600, 120, 5500], 17: [650, 120, 6000], 18: [700, 120, 6500],
      19: [750, 120, 7000], 20: [800, 120, 7500],
    },
  },
  {
    jurisdiction: "KR",
    currency: "KRW",
    fees: {
      3: [120, 150, 170000], 4: [180, 150, 260000], 5: [250, 150, 350000], 6: [330, 150, 470000],
      7: [430, 150, 610000], 8: [540, 150, 770000], 9: [650, 150, 920000], 10: [770, 150, 1090000],
      11: [900, 150, 1280000], 12: [1050, 150, 1490000], 13: [1200, 150, 1700000], 14: [1200, 150, 1700000],
      15: [1200, 150, 1700000], 16: [1200, 150, 1700000], 17: [1200, 150, 1700000], 18: [1200, 150, 1700000],
      19: [1200, 150, 1700000], 20: [1200, 150, 1700000],
    },
  },
];

// European countries with progressive fees
const EUROPEAN_COUNTRIES = [
  { code: "FR", currency: "EUR", base: 38, increment: 10 },
  { code: "DE", currency: "EUR", base: 70, increment: 40 },
  { code: "GB", currency: "GBP", base: 70, increment: 20 },
  { code: "NL", currency: "EUR", base: 40, increment: 10 },
  { code: "IT", currency: "EUR", base: 60, increment: 15 },
  { code: "ES", currency: "EUR", base: 50, increment: 10 },
  { code: "CH", currency: "CHF", base: 100, increment: 20 },
  { code: "SE", currency: "SEK", base: 50, increment: 15 },
  { code: "AT", currency: "EUR", base: 80, increment: 20 },
  { code: "BE", currency: "EUR", base: 50, increment: 10 },
  { code: "DK", currency: "DKK", base: 60, increment: 15 },
  { code: "FI", currency: "EUR", base: 55, increment: 15 },
  { code: "IE", currency: "EUR", base: 60, increment: 15 },
  { code: "PL", currency: "PLN", base: 30, increment: 10 },
  { code: "PT", currency: "EUR", base: 40, increment: 10 },
];

const OTHER_COUNTRIES = [
  { code: "AU", currency: "AUD", base: 200, increment: 30 },
  { code: "CA", currency: "CAD", base: 150, increment: 25 },
  { code: "BR", currency: "BRL", base: 100, increment: 20 },
  { code: "IN", currency: "INR", base: 60, increment: 15 },
];

export function generateRenewalFees(): RenewalFee[] {
  const fees: RenewalFee[] = [];
  const now = new Date();

  // Major jurisdictions with detailed schedules
  for (const schedule of SCHEDULES) {
    for (const [yearStr, [official, agent, local]] of Object.entries(schedule.fees)) {
      fees.push({
        id: crypto.randomUUID() as RenewalFeeId,
        jurisdictionCode: schedule.jurisdiction,
        year: Number(yearStr),
        officialFee: official,
        typicalAgentFee: agent,
        currency: schedule.currency,
        officialFeeLocal: local,
        updatedAt: now,
      });
    }
  }

  // European countries and other countries with progressive fees
  for (const country of [...EUROPEAN_COUNTRIES, ...OTHER_COUNTRIES]) {
    for (let year = 3; year <= 20; year++) {
      const officialFee = country.base + country.increment * (year - 3);
      fees.push({
        id: crypto.randomUUID() as RenewalFeeId,
        jurisdictionCode: country.code,
        year,
        officialFee,
        typicalAgentFee: 120,
        currency: country.currency,
        officialFeeLocal: officialFee, // simplified: same as EUR for EUR countries
        updatedAt: now,
      });
    }
  }

  return fees;
}
