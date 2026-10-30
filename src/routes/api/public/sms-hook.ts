import { createFileRoute } from "@tanstack/react-router";

// Auth "Send SMS" hook: receives the OTP from the auth service and sends it via Turbohost.
async function verify(req: Request, raw: string) {
  const secret = (process.env.SMS_HOOK_SECRET || "").replace(/^v1,/, "").replace(/^whsec_/, "");
  const id = req.headers.get("webhook-id"), ts = req.headers.get("webhook-timestamp"), sig = req.headers.get("webhook-signature");
  if (!secret || !id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const keyBytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return sig.split(" ").some((s) => s.split(",")[1] === expected);
}

export const Route = createFileRoute("/api/public/sms-hook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!(await verify(request, raw))) return new Response(JSON.stringify({ error: "invalid signature" }), { status: 401 });
        const payload = JSON.parse(raw) as { user?: { phone?: string }; sms?: { otp?: string } };
        const phone = payload.user?.phone, otp = payload.sms?.otp;
        if (!phone || !otp) return new Response(JSON.stringify({ error: "missing data" }), { status: 400 });
        try {
          const { sendSms } = await import("@/lib/notify.server");
          await sendSms([phone.startsWith("+") ? phone : `+${phone}`], `Horta Boa: o seu codigo de confirmacao e ${otp}. Valido por 10 minutos.`);
          return new Response("{}", { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          console.error(e);
          return new Response(JSON.stringify({ error: { http_code: 500, message: "Falha ao enviar SMS" } }), { status: 500 });
        }
      },
    },
  },
});
