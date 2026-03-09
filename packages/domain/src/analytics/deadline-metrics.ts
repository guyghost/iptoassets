import type { DeadlineType } from "@ipms/shared";
import { DEADLINE_TYPES } from "@ipms/shared";
import type { Deadline } from "../entities.js";

export interface DeadlineMetrics {
  readonly total: number;
  readonly overdue: number;
  readonly upcoming: number;
  readonly completed: number;
  readonly completionRate: number;
  readonly overdueByType: Record<DeadlineType, number>;
}

const MS_PER_DAY = 86_400_000;

export function computeDeadlineMetrics(deadlines: readonly Deadline[], now: Date): DeadlineMetrics {
  const overdueByType = Object.fromEntries(DEADLINE_TYPES.map((t) => [t, 0])) as Record<DeadlineType, number>;
  let overdue = 0;
  let upcoming = 0;
  let completed = 0;

  const thirtyDaysFromNow = new Date(now.getTime() + 30 * MS_PER_DAY);

  for (const deadline of deadlines) {
    if (deadline.completed) {
      completed++;
      continue;
    }

    if (deadline.dueDate < now) {
      overdue++;
      overdueByType[deadline.type]++;
    } else if (deadline.dueDate <= thirtyDaysFromNow) {
      upcoming++;
    }
  }

  return {
    total: deadlines.length,
    overdue,
    upcoming,
    completed,
    completionRate: deadlines.length > 0 ? completed / deadlines.length : 0,
    overdueByType,
  };
}
