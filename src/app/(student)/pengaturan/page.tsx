import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil dan API key Gemini milikmu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Data akun dasar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" defaultValue="Alimka" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue="kpbgalimka@gmail.com"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>
            Dipakai server-side untuk generate soal AI atas nama akunmu
            sendiri. Tersimpan terenkripsi, tidak pernah ditampilkan penuh
            setelah disimpan. Fitur ini aktif di Fase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gemini-key">API Key</Label>
            <Input id="gemini-key" placeholder="AIza..." disabled />
          </div>
          <Button disabled className="w-fit">
            Simpan (segera hadir)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
