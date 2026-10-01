import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSettings } from "@/components/pengaturan/profile-settings";
import { getMaskedGeminiKey } from "@/server/services/ai-key";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const { user } = await requireUser("/pengaturan");
  // Admin punya halaman profil sendiri di dalam panel admin (tetap dengan sidebar).
  if (user.role === "admin") redirect("/admin/profil");
  const masked = await getMaskedGeminiKey(Number(user.id));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Pengaturan" description="Kelola profil dan API key Gemini milikmu." />

      <ProfileSettings user={user} masked={masked} />
    </div>
  );
}
