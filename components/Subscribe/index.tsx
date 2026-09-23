"use client";

import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { cn } from "@/utils/cn";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "subscribed">(
    "idle",
  );
  const [error, setError] = useState("");
  const emailOk = EMAIL.test(email);
  const submitting = status === "submitting";
  const disabled = submitting;
  const reduceMotion = usePrefersReducedMotion();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || status === "subscribed") return;
    if (!emailOk) {
      setError("Enter a valid e-mail.");
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok) {
        setStatus("idle");
        setError(payload?.error ?? "Could not subscribe. Try again.");
        return;
      }
      setStatus("subscribed");
    } catch {
      setStatus("idle");
      setError("Could not subscribe. Try again.");
    }
  }

  return (
    <motion.div
      className={styles.stage}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
    >
      <form className={styles.root} noValidate onSubmit={onSubmit}>
        <p className={textStyles.bodyMd}>Subscribe for new stuff</p>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              type="email"
              name="email"
              size="m"
              autoComplete="email"
              placeholder="Enter your e-mail"
              value={email}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "subscribe-error" : undefined}
              onChange={(event) => {
                setStatus("idle");
                setError("");
                setEmail(event.target.value);
              }}
            />
            {error ? (
              <p
                id="subscribe-error"
                className={cn(styles.error, textStyles.bodySm)}
                aria-live="polite"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="m"
            fullWidth
            icon={status === "subscribed" ? "checkmark" : undefined}
            disabled={disabled || status === "subscribed"}
          >
            {status === "subscribed"
              ? "Subscribed"
              : submitting
                ? "Subscribing..."
                : "Subscribe"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
