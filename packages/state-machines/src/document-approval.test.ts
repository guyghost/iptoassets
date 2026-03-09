import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { documentApprovalMachine } from "./document-approval.js";

function createTestActor() {
  return createActor(documentApprovalMachine, {
    input: { documentId: "test-doc-1" },
  });
}

describe("documentApprovalMachine", () => {
  it("starts in uploaded state", () => {
    const actor = createTestActor();
    actor.start();
    expect(actor.getSnapshot().value).toBe("uploaded");
    actor.stop();
  });

  it("happy path: uploaded -> under_review -> approved", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "START_REVIEW", reviewerId: "reviewer-1" });
    expect(actor.getSnapshot().value).toBe("under_review");
    actor.send({ type: "APPROVE" });
    expect(actor.getSnapshot().value).toBe("approved");
    expect(actor.getSnapshot().status).toBe("done");
    actor.stop();
  });

  it("rejection with re-review: under_review -> rejected -> under_review", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "START_REVIEW", reviewerId: "reviewer-1" });
    actor.send({ type: "REJECT" });
    expect(actor.getSnapshot().value).toBe("rejected");
    actor.send({ type: "START_REVIEW", reviewerId: "reviewer-2" });
    expect(actor.getSnapshot().value).toBe("under_review");
    actor.stop();
  });
});
