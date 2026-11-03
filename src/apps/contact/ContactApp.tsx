"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Mail, Send, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { profile } from "@/content/profile";
import { GitHubGlyph, LinkedInGlyph } from "@/design/icons/Brand";
import { Button, LinkButton } from "@/design/ui";
import { contactSchema, type ContactInput, type ContactResponse } from "@/lib/contact";
import { copyText, publishActivity } from "@/os/state/activity";
import { AppScroll } from "../shared";

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string; notConfigured?: boolean };

export default function ContactApp() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [configured, setConfigured] = useState<boolean | null>(null);
  const mountedAt = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", subject: "", message: "", company: "" } });

  useEffect(() => {
    mountedAt.current = Date.now();
    fetch("/api/contact", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(null));
  }, []);

  const onSubmit = async (values: ContactInput) => {
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, elapsedMs: Date.now() - mountedAt.current }),
      });
      const data = (await res.json()) as ContactResponse;
      if (data.ok) {
        setStatus({ kind: "sent" });
        publishActivity({ kind: "completed", title: "Message delivered", detail: "Accepted by the mail provider" });
        reset();
      } else {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            if (field in values) setError(field as keyof ContactInput, { message: messages[0] });
          }
        }
        setStatus({ kind: "error", message: data.message, notConfigured: data.reason === "not-configured" });
        publishActivity({ kind: "error", title: "Message not sent", detail: data.message });
      }
    } catch {
      setStatus({ kind: "error", message: "Could not reach the server. Your message was not sent." });
      publishActivity({ kind: "error", title: "Message not sent", detail: "Network error" });
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  return (
    <AppScroll>
      <h3 className="font-display text-2xl font-semibold text-fg">Contact</h3>
      <p className="mt-1 text-[14px] text-muted">The fastest route is email. LinkedIn and GitHub work too.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="card p-4 sm:col-span-3">
          <p className="text-[12px] text-subtle">Email</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <a href={`mailto:${profile.email}`} className="font-display text-[18px] font-semibold text-accent-text underline-offset-2 hover:underline">
              {profile.email}
            </a>
            <Button size="sm" onClick={() => copyText(profile.email, "Email address")}>
              <Copy className="size-3.5" aria-hidden /> Copy
            </Button>
          </div>
        </div>
        <LinkButton href={profile.links.linkedin} className="h-12">
          <LinkedInGlyph /> LinkedIn
        </LinkButton>
        <LinkButton href={profile.links.github} className="h-12">
          <GitHubGlyph /> GitHub
        </LinkButton>
        <LinkButton href={`mailto:${profile.email}`} external={false} className="h-12">
          <Mail className="size-4" aria-hidden /> Open mail app
        </LinkButton>
      </div>

      <section aria-labelledby="contact-form-title" className="card mt-6 p-5">
        <h4 id="contact-form-title" className="font-display text-[17px] font-semibold text-fg">
          Send a message
        </h4>
        {configured === false && (
          <p className="mt-2 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-fg">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            Message delivery isn&apos;t configured on this deployment yet, so the form will not send anything. Please email {profile.email} instead.
          </p>
        )}

        <div ref={statusRef} tabIndex={-1} className="outline-none" aria-live="polite">
          {status.kind === "sent" && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[13.5px] text-fg">
              <CheckCircle2 className="size-4 text-success" aria-hidden /> Your message was delivered. Thank you — I&apos;ll reply by email.
            </p>
          )}
          {status.kind === "error" && (
            <p role="alert" className="mt-3 flex gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[13.5px] text-fg">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span>
                {status.message}{" "}
                {status.notConfigured && (
                  <>
                    You can reach me at{" "}
                    <a className="text-accent-text underline" href={`mailto:${profile.email}`}>
                      {profile.email}
                    </a>
                    .
                  </>
                )}
              </span>
            </p>
          )}
        </div>

        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          <Field label="Your name" error={errors.name} autoComplete="name" {...register("name")} />
          <Field label="Your email" type="email" error={errors.email} autoComplete="email" {...register("email")} />
          <div className="sm:col-span-2">
            <Field label="Subject" error={errors.subject} {...register("subject")} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Message" textarea error={errors.message} {...register("message")} />
          </div>
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Company (leave empty)
              <input tabIndex={-1} autoComplete="off" {...register("company")} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <Send className="size-4" aria-hidden /> {isSubmitting ? "Sending…" : "Send message"}
            </Button>
            <p className="text-[12px] text-subtle">You&apos;ll only see “delivered” if the mail provider accepted it.</p>
          </div>
        </form>

        <details className="mt-4 text-[12.5px] text-muted">
          <summary className="cursor-pointer text-fg">Privacy notice</summary>
          <p className="mt-2 leading-relaxed">
            The form collects only your name, email, subject and message, for the sole purpose of replying to you. This site does not store them: they are passed to the configured email provider (Formspree or Resend) for delivery. A simple per-IP rate limit is applied in memory and is not logged. No cookies, analytics or trackers are used by SHIVAM.OS.
          </p>
        </details>
      </section>
    </AppScroll>
  );
}

type FieldProps = {
  label: string;
  error?: FieldError;
  textarea?: boolean;
  type?: string;
  autoComplete?: string;
} & ReturnType<ReturnType<typeof useForm<ContactInput>>["register"]>;

function Field({ label, error, textarea, type = "text", autoComplete, ...reg }: FieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const common = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
    className:
      "mt-1 w-full rounded-[var(--radius-control)] border bg-sunken px-3 text-[14px] text-fg outline-none placeholder:text-subtle focus:border-accent/70 " +
      (error ? "border-danger/70" : "border-hairline"),
  };
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {label}
      </label>
      {textarea ? <textarea {...common} {...reg} rows={6} className={`${common.className} py-2`} /> : <input {...common} {...reg} type={type} autoComplete={autoComplete} className={`${common.className} h-10`} />}
      {error?.message && (
        <p id={errId} className="mt-1 text-[12.5px] text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
