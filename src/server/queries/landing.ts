// Data landing page (publik). Hanya konten yang memang ada di DB — jangan
// pernah menampilkan klaim yang tidak berasal dari data asli.

import { getSetting, type Testimonial } from "@/server/services/app-settings";

export async function getLandingData(): Promise<{ testimonials: Testimonial[] }> {
  // DB tidak tersedia (mis. saat build) → landing tetap tampil tanpa testimoni.
  try {
    const testimonials = await getSetting("landing.testimonials");
    return { testimonials: testimonials.filter((t) => t.visible) };
  } catch {
    return { testimonials: [] };
  }
}
