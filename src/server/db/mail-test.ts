// Tes SMTP: login ke server SMTP lalu kirim satu email uji.
//   npm run mail:test -- <email tujuan>        # env dari .env
//   npm run prod:mail:test -- <email tujuan>   # env dari .env.prod (SMTP Hostinger)

import { SITE_NAME } from "@/lib/site";
import { sendMail, verifyMail } from "@/server/services/mailer";

async function main() {
  const to = process.argv[2];
  if (!to || !to.includes("@")) throw new Error("Pakai: npm run mail:test -- <email tujuan>");
  console.log(`Login SMTP ke ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 465} sebagai ${process.env.SMTP_USER} …`);
  await verifyMail();
  console.log("✓ Login SMTP berhasil. Mengirim email uji …");
  await sendMail({
    to,
    subject: `Email uji ${SITE_NAME}`,
    text: `Email uji dari ${SITE_NAME}. Bila ini sampai di kotak masuk (bukan Spam), fitur Lupa kata sandi siap dipakai.`,
    html: `<p>Email uji dari <b>${SITE_NAME}</b>. Bila ini sampai di kotak masuk (bukan Spam), fitur <b>Lupa kata sandi</b> siap dipakai.</p>`,
  });
  console.log(`✓ Terkirim ke ${to}. Cek kotak masuk & folder Spam.`);
}

main().then(
  () => process.exit(0),
  (e) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`✗ ${msg}`);
    if (/Invalid login|535|auth/i.test(msg)) console.error("  → SMTP_USER harus alamat email lengkap; cek SMTP_PASS (kata sandi akun email, bukan hPanel).");
    if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(msg)) console.error("  → Cek SMTP_HOST=smtp.hostinger.com dan SMTP_PORT=465 (atau 587).");
    process.exit(1);
  },
);
