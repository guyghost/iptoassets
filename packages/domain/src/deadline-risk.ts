import type { Deadline, DeadlineRisk } from "./entities.js";

export function computeDeadlineRisks(deadlines: readonly Deadline[], now: Date = new Date()): readonly DeadlineRisk[] {
  return deadlines.map((d) => computeSingleRisk(d, deadlines, now));
}

function computeSingleRisk(deadline: Deadline, allDeadlines: readonly Deadline[], now: Date): DeadlineRisk {
  if (deadline.completed) {
    return { deadlineId: deadline.id, score: 0, factors: [] };
  }

  const factors: string[] = [];
  let score = 0;

  const msPerDay = 86_400_000;
  const daysUntilDue = (deadline.dueDate.getTime() - now.getTime()) / msPerDay;

  if (daysUntilDue < 0) {
    score = 10;
    factors.push("Deadline is overdue");
    return { deadlineId: deadline.id, score, factors };
  }

  if (daysUntilDue <= 7) {
    score = 8;
    factors.push("Due within 7 days");
  } else if (daysUntilDue <= 14) {
    score = 6;
    factors.push("Due within 14 days");
  } else if (daysUntilDue <= 30) {
    score = 4;
    factors.push("Due within 30 days");
  } else if (daysUntilDue <= 60) {
    score = 2;
    factors.push("Due within 60 days");
  } else {
    score = 1;
    factors.push("Due in more than 60 days");
  }

  const concurrent = allDeadlines.filter((other) => {
    if (other.id === deadline.id || other.completed) return false;
    const otherDays = (other.dueDate.getTime() - now.getTime()) / msPerDay;
    return Math.abs(otherDays - daysUntilDue) <= 7;
  });

  if (concurrent.length > 0) {
    score = Math.min(10, score + concurrent.length);
    factors.push(`${concurrent.length} concurrent deadline${concurrent.length > 1 ? "s" : ""} within 7-day window`);
  }

  return { deadlineId: deadline.id, score, factors };
}
