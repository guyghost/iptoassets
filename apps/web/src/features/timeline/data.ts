export interface TimelineEvent {
  id: string;
  assetId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  changedBy: string;
}

export async function fetchAssetTimeline(assetId: string): Promise<TimelineEvent[]> {
  const res = await fetch(`/api/assets/${assetId}/timeline`);
  return res.json();
}
