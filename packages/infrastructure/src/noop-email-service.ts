import type { EmailService } from "@ipms/application";

export function createNoOpEmailService(): EmailService {
  return {
    async send() {},
  };
}
