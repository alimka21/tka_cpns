// Atur ulang kata sandi user dari terminal: `npm run user:password -- <email>`.
// Kata sandi baru diketik tersembunyi (tidak tampil di layar / riwayat shell),
// di-hash dengan konfigurasi Better Auth yang sama seperti daftar biasa.
// Dipakai bila admin lupa kata sandi (fitur reset lewat email belum ada).

import { and, eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "./index";
import { accounts, sessions, users } from "./schema";

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      // Buang urutan escape terminal (penanda paste "ESC[200~ … ESC[201~", tombol panah, dll.)
      // supaya tidak ikut tersimpan sebagai bagian kata sandi.
      const ch = chunk.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/\u001b./g, "");
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(130); // Ctrl+C
        if (c === "\u007f" || c === "\b") value = [...value].slice(0, -1).join("");
        else if (c >= " ") value += c; // karakter kontrol lain diabaikan
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Pemakaian: npm run user:password -- <email>");
  const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email));
  if (!user) throw new Error(`User ${email} tidak ditemukan.`);

  const password = await askHidden(`Kata sandi baru untuk ${user.name} <${email}>: `);
  const confirm = await askHidden("Ulangi kata sandi baru: ");
  if (password !== confirm) throw new Error("Kata sandi tidak sama. Tidak ada yang diubah.");
  if (password.length < 8 || password.length > 128) throw new Error("Kata sandi harus 8–128 karakter. Tidak ada yang diubah.");
  if (password !== password.trim()) throw new Error("Kata sandi diawali/diakhiri spasi — kemungkinan tidak sengaja. Tidak ada yang diubah.");
  console.log(`Panjang kata sandi: ${[...password].length} karakter (cocokkan dengan yang Anda ketik).`);

  const hash = await (await auth.$context).password.hash(password);
  const [credential] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));
  if (credential) await db.update(accounts).set({ password: hash }).where(eq(accounts.id, credential.id));
  else await db.insert(accounts).values({ userId: user.id, accountId: String(user.id), providerId: "credential", password: hash });

  // Keluarkan dari semua perangkat supaya hanya kata sandi baru yang berlaku.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  console.log(`✓ Kata sandi ${email} diperbarui. Semua sesi lama dihapus — silakan masuk dengan kata sandi baru.`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
