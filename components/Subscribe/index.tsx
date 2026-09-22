"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { cn } from "@/utils/cn";
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!emailOk || disabled || status === "subscribed") return;
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
    <form className={styles.root} onSubmit={onSubmit}>
      <p className={textStyles.bodyMd}>Subscribe for new stuff</p>
      <div className={styles.fields}>
        <Input
          type="email"
          name="email"
          size="m"
          autoComplete="email"
          placeholder="Enter your e-mail"
          value={email}
          disabled={disabled}
          onChange={(event) => {
            setStatus("idle");
            setError("");
            setEmail(event.target.value);
          }}
        />
        <Button
          type="submit"
          variant="primary"
          size="m"
          fullWidth
          icon={status === "subscribed" ? "checkmark" : undefined}
          disabled={!emailOk || disabled || status === "subscribed"}
        >
          {status === "subscribed"
            ? "Subscribed"
            : submitting
              ? "Subscribing..."
              : "Subscribe"}
        </Button>
        {error ? (
          <p className={cn(styles.error, textStyles.bodyMd)} aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
