import "server-only";
import type { ContactData } from "@/lib/contact";

export type Provider = "formspree" | "resend" | null;

export function configuredProvider(env: NodeJS.ProcessEnv = process.env): Provider {
  if (env.FORMSPREE_FORM_ID && /^[A-Za-z0-9]{4,32}$/.test(env.FORMSPREE_FORM_ID)) return "formspree";
  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) return "resend";
  return null;
}

/** Sends the message through the configured provider. Returns true only when the provider accepted it. */
export async function deliver(data: ContactData, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const provider = configuredProvider(env);
  const body = `${data.message}\n\n— ${data.name} <${data.email}>\nSent from the SHIVAM.OS contact form.`;
  const signal = AbortSignal.timeout(10_000);
  if (provider === "formspree") {
    const res = await fetch(`https://formspree.io/f/${env.FORMSPREE_FORM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, _subject: `[SHIVAM.OS] ${data.subject}`, message: data.message }),
      signal,
    });
    return res.ok;
  }
  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: data.email,
        subject: `[SHIVAM.OS] ${data.subject}`,
        text: body,
      }),
      signal,
    });
    return res.ok;
  }
  return false;
}
