import { Resend } from "resend";

type ContactPayload = {
  name: string;
  email: string;
  topic?: string;
  message: string;
};

/**
 * Sends a contact-form email via Resend. If RESEND_API_KEY is not set (i.e.
 * local dev without secrets), logs to console and returns success — so the
 * form stays testable without provisioning real infra.
 */
export async function sendContactMessage(payload: ContactPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? "founders@autokillswitch.in";
  const from = process.env.CONTACT_FROM_EMAIL ?? "AutoKillSwitch <contact@autokillswitch.in>";

  if (!apiKey) {
    console.log("[contact] RESEND_API_KEY unset — message captured locally:");
    console.log(JSON.stringify(payload, null, 2));
    return { id: "dev-noop", mocked: true as const };
  }

  const resend = new Resend(apiKey);
  const subject = payload.topic
    ? `[Contact · ${payload.topic}] ${payload.name}`
    : `[Contact] ${payload.name}`;

  const text = [
    `From: ${payload.name} <${payload.email}>`,
    payload.topic ? `Topic: ${payload.topic}` : null,
    "",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await resend.emails.send({
    from,
    to,
    replyTo: payload.email,
    subject,
    text,
  });

  if (result.error) throw new Error(result.error.message);
  return { id: result.data?.id ?? "unknown", mocked: false as const };
}
