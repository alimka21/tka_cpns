// Ubah role user: `npm run user:role -- <email> <student|admin>`.
// Satu-satunya cara menjadikan admin (form daftar tidak bisa set role).

import { eq } from "drizzle-orm";
import { ROLES, type Role } from "@/server/auth";
import { db } from "./index";
import { sessions, users } from "./schema";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role as Role)) {
    throw new Error("Pemakaian: npm run user:role -- <email> <student|admin>");
  }
  const [user] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.email, email.trim().toLowerCase()));
  if (!user) throw new Error(`User ${email} belum terdaftar — daftar dulu lewat /daftar.`);
  if (user.role === role) {
    console.log(`${user.name} <${email}> sudah ${role}.`);
    return;
  }
  await db.update(users).set({ role: role as Role }).where(eq(users.id, user.id));
  // Paksa login ulang supaya role baru langsung berlaku di semua perangkat.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  console.log(`✓ ${user.name} <${email}>: ${user.role} → ${role}. Sesi lama dihapus, silakan masuk lagi.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`✗ ${error.message ?? error}`);
    process.exit(1);
  });
