import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Daftar Akun" };

export default function DaftarPage() {
  return <AuthForm mode="signup" />;
}
