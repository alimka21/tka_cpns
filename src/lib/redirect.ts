/**
 * Validasi parameter `?next=` supaya tidak bisa dipakai open redirect:
 * hanya path relatif di situs ini ("/..."), bukan "//domain" atau URL penuh.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
