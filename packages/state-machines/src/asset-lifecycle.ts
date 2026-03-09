import { setup, assign } from "xstate";
import type { AssetStatus } from "@ipms/shared";
import { validateStatusTransition } from "@ipms/domain";

type AssetLifecycleContext = {
  assetId: string;
  status: AssetStatus;
};

type AssetLifecycleEvent =
  | { type: "FILE" }
  | { type: "PUBLISH" }
  | { type: "GRANT" }
  | { type: "EXPIRE" }
  | { type: "ABANDON" };

export const assetLifecycleMachine = setup({
  types: {
    context: {} as AssetLifecycleContext,
    events: {} as AssetLifecycleEvent,
    input: {} as { assetId: string },
  },
  guards: {
    canFile: ({ context }) =>
      validateStatusTransition(context.status, "filed").ok,
    canPublish: ({ context }) =>
      validateStatusTransition(context.status, "published").ok,
    canGrant: ({ context }) =>
      validateStatusTransition(context.status, "granted").ok,
    canExpire: ({ context }) =>
      validateStatusTransition(context.status, "expired").ok,
    canAbandon: ({ context }) =>
      validateStatusTransition(context.status, "abandoned").ok,
  },
  actions: {
    setFiled: assign({ status: "filed" as const }),
    setPublished: assign({ status: "published" as const }),
    setGranted: assign({ status: "granted" as const }),
    setExpired: assign({ status: "expired" as const }),
    setAbandoned: assign({ status: "abandoned" as const }),
  },
}).createMachine({
  id: "assetLifecycle",
  initial: "draft",
  context: ({ input }) => ({
    assetId: input.assetId,
    status: "draft" as const,
  }),
  states: {
    draft: {
      on: {
        FILE: {
          target: "filed",
          guard: "canFile",
          actions: "setFiled",
        },
        ABANDON: {
          target: "abandoned",
          guard: "canAbandon",
          actions: "setAbandoned",
        },
      },
    },
    filed: {
      on: {
        PUBLISH: {
          target: "published",
          guard: "canPublish",
          actions: "setPublished",
        },
        GRANT: {
          target: "granted",
          guard: "canGrant",
          actions: "setGranted",
        },
        ABANDON: {
          target: "abandoned",
          guard: "canAbandon",
          actions: "setAbandoned",
        },
      },
    },
    published: {
      on: {
        GRANT: {
          target: "granted",
          guard: "canGrant",
          actions: "setGranted",
        },
        ABANDON: {
          target: "abandoned",
          guard: "canAbandon",
          actions: "setAbandoned",
        },
      },
    },
    granted: {
      on: {
        EXPIRE: {
          target: "expired",
          guard: "canExpire",
          actions: "setExpired",
        },
      },
    },
    expired: {
      type: "final",
    },
    abandoned: {
      type: "final",
    },
  },
});
