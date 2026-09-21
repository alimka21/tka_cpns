import Link from "next/link";

const navItems = [
  { href: "/admin/topik", label: "Topik & Subtopik" },
  { href: "/admin/soal", label: "Soal" },
  { href: "/admin/paket-tes", label: "Paket Tes" },
  { href: "/admin/users", label: "User" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 border-r px-4 py-6">
        <div className="mb-6 px-2 text-sm font-semibold text-muted-foreground">
          Panel Admin
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
