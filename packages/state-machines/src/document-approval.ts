import { setup } from "xstate";

type DocumentApprovalContext = {
  documentId: string;
  reviewerId: string | null;
};

type DocumentApprovalEvent =
  | { type: "START_REVIEW"; reviewerId: string }
  | { type: "APPROVE" }
  | { type: "REJECT" };

export const documentApprovalMachine = setup({
  types: {
    context: {} as DocumentApprovalContext,
    events: {} as DocumentApprovalEvent,
    input: {} as { documentId: string },
  },
}).createMachine({
  id: "documentApproval",
  initial: "uploaded",
  context: ({ input }) => ({
    documentId: input.documentId,
    reviewerId: null,
  }),
  states: {
    uploaded: {
      on: {
        START_REVIEW: {
          target: "under_review",
        },
      },
    },
    under_review: {
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
      type: "final",
    },
    rejected: {
      on: {
        START_REVIEW: {
          target: "under_review",
        },
      },
    },
  },
});
