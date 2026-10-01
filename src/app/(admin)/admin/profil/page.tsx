import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSettings } from "@/components/pengaturan/profile-settings";
import { requireAdmin } from "@/server/auth/session";
import { getMaskedGeminiKey } from "@/server/services/ai-key";

export const metadata: Metadata = { title: "Profil & API Key" };
export const dynamic = "force-dynamic";

export default async function AdminProfilPage() {
  const { user } = await requireAdmin("/admin/profil");
  const masked = await getMaskedGeminiKey(Number(user.id));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Profil & API Key" description="Data akun admin dan API key Gemini untuk Generate Soal AI." />
      <ProfileSettings user={user} masked={masked} />
    </div>
  );
}
