import { Resend } from "resend";
import type { EmailService } from "@ipms/application";

export function createResendEmailService(apiKey: string, fromAddress: string): EmailService {
  const resend = new Resend(apiKey);

  return {
    async send(to, subject, html) {
      await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
      });
    },
  };
}
