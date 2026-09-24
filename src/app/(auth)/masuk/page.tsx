import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Masuk" };

export default function MasukPage() {
  return <AuthForm mode="signin" />;
}
