import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { assetLifecycleMachine } from "./asset-lifecycle.js";

function createTestActor() {
  return createActor(assetLifecycleMachine, {
    input: { assetId: "test-asset-1" },
  });
}

describe("assetLifecycleMachine", () => {
  it("starts in draft state", () => {
    const actor = createTestActor();
    actor.start();
    expect(actor.getSnapshot().value).toBe("draft");
    actor.stop();
  });

  it("transitions draft -> filed", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "FILE" });
    expect(actor.getSnapshot().value).toBe("filed");
    actor.stop();
  });

  it("transitions filed -> published -> granted -> expired", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "FILE" });
    actor.send({ type: "PUBLISH" });
    expect(actor.getSnapshot().value).toBe("published");
    actor.send({ type: "GRANT" });
    expect(actor.getSnapshot().value).toBe("granted");
    actor.send({ type: "EXPIRE" });
    expect(actor.getSnapshot().value).toBe("expired");
    actor.stop();
  });

  it("transitions draft -> abandoned", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "ABANDON" });
    expect(actor.getSnapshot().value).toBe("abandoned");
    actor.stop();
  });

  it("does not allow invalid transitions", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "GRANT" }); // invalid from draft
    expect(actor.getSnapshot().value).toBe("draft");
    actor.stop();
  });

  it("expired is a final state", () => {
    const actor = createTestActor();
    actor.start();
    actor.send({ type: "FILE" });
    actor.send({ type: "GRANT" });
    actor.send({ type: "EXPIRE" });
    expect(actor.getSnapshot().status).toBe("done");
    actor.stop();
  });
});
