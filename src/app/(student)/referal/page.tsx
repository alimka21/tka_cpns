import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { affiliateOfUser } from "@/server/services/affiliates";

// Referal siswa → siswa dimatikan 2026-11-13; halaman ini kini mengarah ke afiliasi guru / Premium.
export default async function ReferalPage() {
  const { user } = await requireUser("/referal");
  redirect((await affiliateOfUser(Number(user.id))) ? "/afiliasi" : "/langganan");
}
