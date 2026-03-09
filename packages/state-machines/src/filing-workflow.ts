import { setup } from "xstate";

type FilingContext = {
  assetId: string;
  reviewerId: string | null;
  comments: string[];
};

type FilingEvent =
  | { type: "SUBMIT_FOR_REVIEW"; reviewerId: string }
  | { type: "APPROVE"; comment?: string }
  | { type: "REJECT"; comment: string }
  | { type: "SUBMIT_FILING" };

export const filingWorkflowMachine = setup({
  types: {
    context: {} as FilingContext,
    events: {} as FilingEvent,
    input: {} as { assetId: string },
  },
  actions: {
    assignReviewer: ({ context, event }) => {
      // handled by assign
    },
    addComment: ({ context, event }) => {
      // handled by assign
    },
  },
  guards: {
    hasReviewer: ({ context }) => context.reviewerId !== null,
  },
}).createMachine({
  id: "filingWorkflow",
  initial: "draft",
  context: ({ input }) => ({
    assetId: input.assetId,
    reviewerId: null,
    comments: [],
  }),
  states: {
    draft: {
      on: {
        SUBMIT_FOR_REVIEW: {
          target: "review",
        },
      },
    },
    review: {
      on: {
        APPROVE: {
          target: "approved",
        },
        REJECT: {
          target: "rejected",
        },
      },
    },
    approved: {
      on: {
        SUBMIT_FILING: {
          target: "submitted",
        },
      },
    },
    rejected: {
      on: {
        SUBMIT_FOR_REVIEW: {
          target: "review",
        },
      },
    },
    submitted: {
      type: "final",
    },
  },
});
