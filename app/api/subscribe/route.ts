import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MailchimpError = {
  title?: string;
  detail?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const dc = apiKey?.split("-").at(-1);

  if (!apiKey || !audienceId || !dc) {
    return NextResponse.json(
      { error: "Subscribe is not configured." },
      { status: 503 },
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim() : "";
  } catch {
    return NextResponse.json({ error: "Enter your e-mail." }, { status: 400 });
  }

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid e-mail." }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();

  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        tags: ["normalize-metrics"],
        ...(ip ? { ip_signup: ip } : {}),
      }),
    },
  );

  if (response.ok) {
    return NextResponse.json({ ok: true });
  }

  const payload = (await response.json().catch(() => null)) as MailchimpError | null;

  if (payload?.title === "Member Exists") {
    return NextResponse.json({ ok: true });
  }

  console.error("Mailchimp subscribe failed", response.status, payload?.title);

  if (payload?.title === "Invalid Resource") {
    return NextResponse.json({ error: "Enter a valid e-mail." }, { status: 400 });
  }

  if (payload?.title === "Forgotten Email Not Subscribed") {
    return NextResponse.json(
      { error: "This e-mail can’t be resubscribed." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: "Could not subscribe. Try again." },
    { status: 502 },
  );
}
