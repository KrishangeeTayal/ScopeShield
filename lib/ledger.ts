
export type LedgerStatus = "unresolved" | "accepted" | "rejected";

export type LedgerFinding = {
  id: string;
  projectName: string;
  request: string;
  classification:
    | "already_included"
    | "potential_addition"
    | "needs_clarification";
  evidence: string;
  reason: string;
  needsHumanReview: boolean;
    status: LedgerStatus;
  createdAt: string;

  estimatedHours: number | null;
  proposedCost: number | null;
  deadlineImpactDays: number | null;
};

export function createLedgerFinding(
  finding: Omit<
    LedgerFinding,
    | "id"
    | "status"
    | "createdAt"
    | "estimatedHours"
    | "proposedCost"
    | "deadlineImpactDays"
  >
): LedgerFinding {
  return {
    ...finding,
    id: crypto.randomUUID(),
    status: "unresolved",
    createdAt: new Date().toISOString(),

    // These remain empty until the freelancer enters estimates.
    estimatedHours: null,
    proposedCost: null,
    deadlineImpactDays: null,
  };
}

export function updateLedgerStatus(
  ledger: LedgerFinding[],
  id: string,
  status: LedgerStatus
): LedgerFinding[] {
  return ledger.map((finding) =>
    finding.id === id ? { ...finding, status } : finding
  );
}

export function getLedgerCounts(ledger: LedgerFinding[]) {
  return {
    total: ledger.length,
    unresolved: ledger.filter((item) => item.status === "unresolved").length,
    accepted: ledger.filter((item) => item.status === "accepted").length,
    rejected: ledger.filter((item) => item.status === "rejected").length,
  };
}

export function getAcceptedImpact(ledger: LedgerFinding[]) {
  const accepted = ledger.filter(
    (finding) => finding.status === "accepted"
  );

  return {
    totalHours: accepted.reduce(
      (total, finding) => total + (finding.estimatedHours ?? 0),
      0
    ),

    totalCost: accepted.reduce(
      (total, finding) => total + (finding.proposedCost ?? 0),
      0
    ),

    totalDeadlineDays: accepted.reduce(
      (total, finding) => total + (finding.deadlineImpactDays ?? 0),
      0
    ),
  };
}
