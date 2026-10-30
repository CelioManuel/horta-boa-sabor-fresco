// Server-only helpers: Turbohost SMS API and Turbohost SMTP email.
export async function sendSms(numbers: string[], message: string) {
  const token = process.env.TURBOHOST_SMS_TOKEN;
  if (!token) throw new Error("TURBOHOST_SMS_TOKEN não configurado");
  const res = await fetch("https://my.turbo.host/api/international-sms/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_token: token, origin: process.env.SMS_SENDER || "Horta Boa", message, numbers }),
  });
  const body = await res.text();
  if (!res.ok || !body.includes("successful")) throw new Error(`SMS falhou [${res.status}]: ${body}`);
}

export async function sendEmail(to: string, subject: string, text: string) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await t.sendMail({ from: `"Horta Boa" <${process.env.SMTP_USER}>`, to, subject, text });
}
