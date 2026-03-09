import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { filingWorkflowMachine } from "./filing-workflow.js";

function createTestActor() {
  return createActor(filingWorkflowMachine, {
    input: { assetId: "test-asset-1" },
  });
}

describe("filingWorkflowMachine", () => {
  it("starts in draft state", () => {
    const actor = createTestActor();
    actor.start();
    expect(actor.getSnapshot().value).toBe("draft");
    actor.stop();
  });

  it("full happy path: draft -> review -> approved -> submitted", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "SUBMIT_FOR_REVIEW", reviewerId: "reviewer-1" });
    expect(actor.getSnapshot().value).toBe("review");
    actor.send({ type: "APPROVE" });
    expect(actor.getSnapshot().value).toBe("approved");
    actor.send({ type: "SUBMIT_FILING" });
    expect(actor.getSnapshot().value).toBe("submitted");
    expect(actor.getSnapshot().status).toBe("done");
    actor.stop();
  });

  it("rejection loop: review -> rejected -> review", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "SUBMIT_FOR_REVIEW", reviewerId: "reviewer-1" });
    actor.send({ type: "REJECT", comment: "Needs work" });
    expect(actor.getSnapshot().value).toBe("rejected");
    actor.send({ type: "SUBMIT_FOR_REVIEW", reviewerId: "reviewer-2" });
    expect(actor.getSnapshot().value).toBe("review");
    actor.stop();
  });
});
