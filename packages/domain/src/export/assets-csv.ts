import type { IPAsset } from "../entities.js";

const HEADER = ["ID", "Title", "Type", "Jurisdiction", "Status", "Owner", "Filing Date", "Expiration Date"];

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().split("T")[0]!;
}

export function assetsToCSVRows(assets: readonly IPAsset[]): string[][] {
  const rows: string[][] = [HEADER];
  for (const asset of assets) {
    rows.push([
      asset.id,
      asset.title,
      asset.type,
      `${asset.jurisdiction.code} - ${asset.jurisdiction.name}`,
      asset.status,
      asset.owner,
      formatDate(asset.filingDate),
      formatDate(asset.expirationDate),
    ]);
  }
  return rows;
}

export function csvRowsToString(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) => row.map((cell) => {
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(","))
    .join("\n");
}
