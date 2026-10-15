import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENT_META, NO_THRESHOLD_NOTE, type ScoreView } from "@/lib/score-display";

/**
 * Kategori capaian resmi (Baik/Memadai/Kurang) + Predikat Istimewa untuk
 * nilai per mata uji. Ambang belum diatur admin → keterangan, bukan tebakan.
 */
export function AchievementBadge({ score, showMissing = true }: { score: ScoreView; showMissing?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {score.category ? (
        <Badge variant={ACHIEVEMENT_META[score.category].variant}>{ACHIEVEMENT_META[score.category].label}</Badge>
      ) : (
        showMissing && <Badge variant="muted">{NO_THRESHOLD_NOTE}</Badge>
      )}
      {score.istimewa && (
        <Badge variant="info">
          <Award aria-hidden /> Istimewa
        </Badge>
      )}
    </span>
  );
}
