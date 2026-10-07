// Kirim email lewat SMTP (Hostinger: smtp.hostinger.com:465) — env SMTP_HOST,
// SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM (WORKFLOW §10). HANYA kode server.

import nodemailer, { type Transporter } from "nodemailer";
import { SITE_NAME } from "@/lib/site";

function env(name: string) {
  const v = process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return v || undefined;
}

/** Fitur "Lupa kata sandi" aktif hanya bila SMTP lengkap. */
export function isMailConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const port = Number(env("SMTP_PORT") ?? 465);
    transporter = nodemailer.createTransport({
      host: env("SMTP_HOST"),
      port,
      secure: port === 465, // 465 = SSL langsung; 587 = STARTTLS
      auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return transporter;
}

function fromAddress() {
  return env("EMAIL_FROM") ?? `"${SITE_NAME}" <${env("SMTP_USER")}>`;
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string }) {
  if (!isMailConfigured()) throw new Error("SMTP belum dikonfigurasi (SMTP_HOST / SMTP_USER / SMTP_PASS).");
  await getTransporter().sendMail({ from: fromAddress(), ...message });
}

/** Tes koneksi & login SMTP (tanpa mengirim email) — dipakai skrip mail:test. */
export async function verifyMail() {
  if (!isMailConfigured()) throw new Error("SMTP belum dikonfigurasi (SMTP_HOST / SMTP_USER / SMTP_PASS).");
  await getTransporter().verify();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function resetPasswordEmail(name: string, url: string) {
  const subject = `Atur ulang kata sandi ${SITE_NAME}`;
  const text = [
    `Halo ${name},`,
    "",
    `Kami menerima permintaan untuk mengatur ulang kata sandi akun ${SITE_NAME} kamu.`,
    "Buka tautan berikut untuk membuat kata sandi baru (berlaku 1 jam, sekali pakai):",
    url,
    "",
    "Kalau kamu tidak meminta ini, abaikan email ini — kata sandimu tidak berubah.",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#1d4ed8">${escapeHtml(SITE_NAME)}</p>
<p style="margin:0 0 12px">Halo ${escapeHtml(name)},</p>
<p style="margin:0 0 20px;line-height:1.5">Kami menerima permintaan untuk mengatur ulang kata sandi akunmu. Klik tombol di bawah untuk membuat kata sandi baru.</p>
<p style="margin:0 0 20px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Atur ulang kata sandi</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5">Tautan berlaku 1 jam dan hanya bisa dipakai sekali. Bila tombol tidak bisa diklik, salin alamat ini ke browser:</p>
<p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#1d4ed8">${escapeHtml(url)}</p>
<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Kalau kamu tidak meminta ini, abaikan email ini — kata sandimu tidak berubah.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
