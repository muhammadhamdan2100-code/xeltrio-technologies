"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { CONTACT_SERVICE_OPTIONS, CONTACT_BUDGET_OPTIONS, CONTACT_TIMELINE_OPTIONS } from "@/lib/constants";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fieldClasses =
  "w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] outline-none transition-colors duration-200 focus:border-[color:var(--color-accent-primary)]";

const labelClasses = "mb-2 block font-mono-tech text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Simulate form submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      setError("Something went wrong sending that — please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent-primary)]/10">
          <CheckCircle2 size={26} className="text-[color:var(--color-accent-secondary)]" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
          Message received.
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Thanks for reaching out — the team will get back to you directly.
        </p>
        <button
          type="button"
          data-cursor="button"
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm font-medium text-[color:var(--color-accent-secondary)] transition-colors hover:text-[color:var(--color-text-primary)]"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Full Name
        </label>
        <input id="fullName" name="fullName" type="text" required placeholder="Jane Doe" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="companyName" className={labelClasses}>
          Company Name
        </label>
        <input id="companyName" name="companyName" type="text" placeholder="Acme Inc." className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="email" className={labelClasses}>
          Email Address
        </label>
        <input id="email" name="email" type="email" required placeholder="jane@company.com" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone Number
        </label>
        <input id="phone" name="phone" type="tel" placeholder="+92 300 0000000" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="country" className={labelClasses}>
          Country
        </label>
        <input id="country" name="country" type="text" placeholder="Pakistan" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="service" className={labelClasses}>
          Service Required
        </label>
        <select id="service" name="service" defaultValue="" required className={fieldClasses}>
          <option value="" disabled>
            Select a service
          </option>
          {CONTACT_SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="budget" className={labelClasses}>
          Budget Range
        </label>
        <select id="budget" name="budget" defaultValue="" className={fieldClasses}>
          <option value="" disabled>
            Select a range
          </option>
          {CONTACT_BUDGET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="timeline" className={labelClasses}>
          Project Timeline
        </label>
        <select id="timeline" name="timeline" defaultValue="" className={fieldClasses}>
          <option value="" disabled>
            Select a timeline
          </option>
          {CONTACT_TIMELINE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className={labelClasses}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you're looking to build..."
          className={`${fieldClasses} resize-none`}
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          data-cursor="button"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-primary)] px-8 py-4 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.01] hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={submitting ? "sending" : "idle"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-2"
            >
              {submitting ? "Sending..." : "Send Message"}
              {!submitting && <Send size={15} />}
            </motion.span>
          </AnimatePresence>
        </button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-[color:var(--color-danger)]"
          >
            <AlertCircle size={15} />
            {error}
          </motion.p>
        )}
      </div>
    </form>
  );
}
