// Server-only helpers: Turbohost SMS API and Turbohost SMTP email, with timeouts and retries.
async function withRetry<T>(label: string, attempts: number, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.error(`Notificação ${label} tentativa ${i}/${attempts} falhou:`, e instanceof Error ? e.message : e);
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw last;
}

export async function sendSms(numbers: string[], message: string) {
  const token = process.env["TURBOHOST_SMS_TOKEN"];
  if (!token) throw new Error("TURBOHOST_SMS_TOKEN não configurado");
  const to = numbers.map((n) => n.replace(/\D/g, ""));
  await withRetry("SMS", 3, async () => {
    const res = await fetch("https://my.turbo.host/api/international-sms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_token: token, origin: process.env["SMS_SENDER"] || "Horta Boa", message, numbers: to }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.text();
    if (!res.ok || !body.includes("successful")) throw new Error(`SMS recusada [${res.status}]: ${body}`);
    console.log("SMS enviada:", body);
  });
}

export async function sendEmail(to: string, subject: string, text: string) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(process.env["SMTP_PORT"] || 587);
  const t = nodemailer.createTransport({
    host: process.env["SMTP_HOST"], port, secure: port === 465,
    auth: { user: process.env["SMTP_USER"], pass: process.env["SMTP_PASS"] },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
  });
  await withRetry("email", 3, async () => {
    await t.sendMail({ from: `"Horta Boa" <${process.env["SMTP_USER"]}>`, to, subject, text });
    console.log("Email enviado para", to);
  });
}
