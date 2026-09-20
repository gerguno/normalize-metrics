"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const emailOk = EMAIL.test(email);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (emailOk) setSubscribed(true);
  }

  return (
    <form className={styles.root} onSubmit={onSubmit}>
      <p className={textStyles.bodySm}>Subscribe for new stuff</p>
      <div className={styles.fields}>
        <Input
          type="email"
          placeholder="Enter your e-mail"
          value={email}
          onChange={(event) => {
            setSubscribed(false);
            setEmail(event.target.value);
          }}
        />
        <Button type="submit" variant="primary" fullWidth disabled={!emailOk}>
          {subscribed ? "Subscribed" : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
