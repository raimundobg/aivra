import * as https from "https";
import * as logger from "firebase-functions/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "Aivra <noreply@aivra.cl>";
const SMTP_USER = process.env.MAIL_USERNAME ?? "";
const SMTP_PASS = process.env.MAIL_PASSWORD ?? "";

// ─── Resend (primary) ────────────────────────────────────────────────────────

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; error?: string }> {
  return new Promise(resolve => {
    if (!RESEND_API_KEY) {
      resolve({ success: false, error: "RESEND_API_KEY not set" });
      return;
    }

    const body = JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      html,
      text,
    });

    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ success: true });
          } else {
            const msg = (() => { try { return JSON.parse(data).message; } catch { return data; } })();
            resolve({ success: false, error: `Resend ${res.statusCode}: ${msg}` });
          }
        });
      }
    );
    req.on("error", e => resolve({ success: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

// ─── Gmail SMTP fallback (nodemailer-free, raw SMTP) ─────────────────────────

async function sendViaSmtp(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; error?: string }> {
  if (!SMTP_USER || !SMTP_PASS) {
    return { success: false, error: "SMTP credentials not set" };
  }
  try {
    // Dynamic import to keep bundle small when SMTP not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_SERVER ?? "smtp.gmail.com",
      port: parseInt(process.env.MAIL_PORT ?? "587"),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({ from: SMTP_USER, to, subject, html, text });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Unified sender ──────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; error?: string }> {
  if (RESEND_API_KEY) {
    const result = await sendViaResend(to, subject, html, text);
    if (result.success) {
      logger.info(`[email] sent via Resend to ${to} — "${subject}"`);
      return result;
    }
    logger.warn(`[email] Resend failed (${result.error}), trying SMTP`);
  }

  const result = await sendViaSmtp(to, subject, html, text);
  if (result.success) {
    logger.info(`[email] sent via SMTP to ${to} — "${subject}"`);
  } else {
    logger.error(`[email] all backends failed for ${to}: ${result.error}`);
  }
  return result;
}

// ─── Templates ───────────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #faf9f7;
  padding: 32px 16px;
`;

const CARD_STYLE = `
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 36px;
  border: 1px solid #e8e4df;
`;

const LOGO = `
  <div style="margin-bottom: 28px;">
    <div style="display:inline-flex; align-items:center; gap:8px;">
      <div style="width:32px;height:32px;background:#3d5a3e;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-weight:800;font-size:11px;">AI</span>
      </div>
      <span style="font-weight:700;font-size:18px;color:#1a1a1a;">Aivra</span>
    </div>
  </div>
`;

const BTN = (href: string, label: string) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="background:#3d5a3e;color:#ffffff;padding:14px 32px;border-radius:999px;
       text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
      ${label}
    </a>
  </div>
`;

const FOOTER = `
  <hr style="border:none;border-top:1px solid #e8e4df;margin:28px 0;">
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
    Aivra &mdash; Nutrición inteligente &mdash; <a href="https://aivra.cl" style="color:#9ca3af;">aivra.cl</a>
  </p>
`;

// ─── 1. Patient welcome ───────────────────────────────────────────────────────

export async function sendPatientWelcome(to: string, name: string, appUrl = "https://aivra.cl") {
  const firstName = name.split(" ")[0];
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    ${LOGO}
    <h2 style="color:#1a1a1a;font-size:22px;font-weight:800;margin:0 0 12px;">¡Bienvenida, ${firstName}! 👋</h2>
    <p style="color:#6b6b6b;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Tu cuenta de paciente en Aivra está activa. Ya puedes ver tu pauta nutricional,
      registrar tus hábitos y chatear con tu nutricionista.
    </p>
    ${BTN(`${appUrl}/dashboard`, "Ir a mi dashboard")}
    <p style="color:#6b6b6b;font-size:13px;line-height:1.6;margin:0;">
      Si tienes dudas, responde a este correo o escríbele directamente a tu nutricionista desde el chat.
    </p>
    ${FOOTER}
  </div>
</body></html>`;

  const text = `Hola ${firstName},\n\nBienvenida a Aivra. Tu cuenta está activa.\n\nIngresa aquí: ${appUrl}/dashboard\n\nSaludos,\nEquipo Aivra`;
  return sendEmail(to, "¡Bienvenida a Aivra! 🌿", html, text);
}

// ─── 2. Nutritionist: patient completed onboarding ───────────────────────────

export async function sendOnboardingCompleteToNutri(
  nutriEmail: string,
  nutriName: string,
  patientName: string,
  patientUid: string,
  appUrl = "https://aivra.cl"
) {
  const firstName = nutriName.split(" ")[0];
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    ${LOGO}
    <h2 style="color:#1a1a1a;font-size:22px;font-weight:800;margin:0 0 12px;">Nuevo formulario completado 📋</h2>
    <p style="color:#6b6b6b;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Hola ${firstName}, <strong>${patientName}</strong> acaba de completar su formulario de onboarding.
      Ya puedes revisar su ficha clínica y generar su primera pauta.
    </p>
    <div style="background:#f0f4f0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#3d5a3e;font-size:13px;font-weight:600;">Paciente: ${patientName}</p>
      <p style="margin:4px 0 0;color:#6b6b6b;font-size:12px;">Onboarding completado</p>
    </div>
    ${BTN(`${appUrl}/nutricionista/paciente/${patientUid}`, "Ver ficha del paciente")}
    ${FOOTER}
  </div>
</body></html>`;

  const text = `Hola ${firstName},\n\n${patientName} completó su onboarding.\n\nVer ficha: ${appUrl}/nutricionista/paciente/${patientUid}\n\nSaludos,\nAivra`;
  return sendEmail(nutriEmail, `${patientName} completó su formulario de onboarding`, html, text);
}

// ─── 3. Nutritionist: new chat message from patient ──────────────────────────

export async function sendChatNotificationToNutri(
  nutriEmail: string,
  nutriName: string,
  patientName: string,
  messagePreview: string,
  patientUid: string,
  appUrl = "https://aivra.cl"
) {
  const firstName = nutriName.split(" ")[0];
  const preview = messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview;
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    ${LOGO}
    <h2 style="color:#1a1a1a;font-size:22px;font-weight:800;margin:0 0 12px;">Nuevo mensaje 💬</h2>
    <p style="color:#6b6b6b;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Hola ${firstName}, <strong>${patientName}</strong> te envió un mensaje:
    </p>
    <div style="background:#f0f4f0;border-radius:12px;padding:16px 20px;margin:20px 0;
         border-left:3px solid #3d5a3e;">
      <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.6;font-style:italic;">"${preview}"</p>
    </div>
    ${BTN(`${appUrl}/nutricionista/paciente/${patientUid}`, "Responder en Aivra")}
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      Responde directamente desde el dashboard — no respondas a este correo.
    </p>
    ${FOOTER}
  </div>
</body></html>`;

  const text = `Hola ${firstName},\n\n${patientName} te escribió:\n"${preview}"\n\nResponde aquí: ${appUrl}/nutricionista/paciente/${patientUid}\n\nSaludos,\nAivra`;
  return sendEmail(nutriEmail, `Nuevo mensaje de ${patientName}`, html, text);
}
