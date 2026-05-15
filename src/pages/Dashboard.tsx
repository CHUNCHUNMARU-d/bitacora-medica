import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileText, Search, X } from "lucide-react";
import {
  useCirugiasQuery,
  useProcedimientos,
  type SortMode,
} from "@/hooks/useCirugias";
import { useStats } from "@/hooks/useStats";
import { useDebounce } from "@/hooks/useDebounce";
import { CirugiasTable } from "@/components/tables/CirugiasTable";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { StatsCharts } from "@/components/dashboard/StatsCharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveCsv, savePdf } from "@/lib/export";

const SORT_LABELS: Record<SortMode, string> = {
  fecha_desc: "Fecha (más reciente)",
  fecha_asc: "Fecha (más antigua)",
  paciente_asc: "Paciente (A-Z)",
  paciente_desc: "Paciente (Z-A)",
};

const ALL_PROCEDIMIENTOS = "__all__";

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full hover:bg-secondary-foreground/10"
        aria-label={`Limpiar ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function buildSubtitle(args: {
  search: string;
  procedimiento: string | null;
  desde: string | null;
  hasta: string | null;
}): string | undefined {
  const parts: string[] = [];
  if (args.search.trim()) parts.push(`Búsqueda: "${args.search.trim()}"`);
  if (args.procedimiento) parts.push(`Procedimiento: ${args.procedimiento}`);
  if (args.desde && args.hasta) parts.push(`${args.desde} a ${args.hasta}`);
  else if (args.desde) parts.push(`desde ${args.desde}`);
  else if (args.hasta) parts.push(`hasta ${args.hasta}`);
  return parts.length ? parts.join(" · ") : undefined;
}

export function Dashboard() {
  const [search, setSearch] = useState("");
  const [procedimiento, setProcedimiento] = useState<string | null>(null);
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [sort, setSort] = useState<SortMode>("fecha_desc");

  const debouncedSearch = useDebounce(search, 300);

  const { rows, loading, error } = useCirugiasQuery({
    search: debouncedSearch,
    procedimiento,
    desde: desde || null,
    hasta: hasta || null,
    sort,
  });
  const { values: procedimientos } = useProcedimientos();
  const { stats } = useStats();

  const hasActiveFilters =
    search.trim().length > 0 ||
    procedimiento !== null ||
    desde !== "" ||
    hasta !== "";

  async function onExportCsv() {
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const path = await saveCsv(rows, `cirugias-${stamp}.csv`);
      if (path) toast.success(`CSV guardado en ${path}`);
    } catch (e) {
      toast.error(`Error al exportar CSV: ${e}`);
    }
  }

  async function onExportPdf() {
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const subtitle = buildSubtitle({
        search,
        procedimiento,
        desde: desde || null,
        hasta: hasta || null,
      });
      const path = await savePdf(
        rows,
        "Bitácora de cirugías",
        `cirugias-${stamp}.pdf`,
        subtitle,
      );
      if (path) toast.success(`PDF guardado en ${path}`);
    } catch (e) {
      toast.error(`Error al exportar PDF: ${e}`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {loading ? "..." : `${rows.length} cirugías`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onExportCsv}
            disabled={rows.length === 0}
          >
            <Download className="size-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={onExportPdf}
            disabled={rows.length === 0}
          >
            <FileText className="size-4" />
            PDF
          </Button>
          <Button asChild>
            <Link to="/nueva">Nueva cirugía</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-2 border-b border-border pb-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente, diagnóstico, procedimiento..."
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-40"
          />
        </div>

        <Select
          value={procedimiento ?? ALL_PROCEDIMIENTOS}
          onValueChange={(v) =>
            setProcedimiento(v === ALL_PROCEDIMIENTOS ? null : v)
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Procedimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROCEDIMIENTOS}>
              Todos los procedimientos
            </SelectItem>
            {procedimientos.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search.trim() && (
            <Chip
              label={`Búsqueda: "${search.trim()}"`}
              onClear={() => setSearch("")}
            />
          )}
          {procedimiento && (
            <Chip label={procedimiento} onClear={() => setProcedimiento(null)} />
          )}
          {desde && <Chip label={`Desde ${desde}`} onClear={() => setDesde("")} />}
          {hasta && <Chip label={`Hasta ${hasta}`} onClear={() => setHasta("")} />}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-100"
            onClick={() => {
              setSearch("");
              setProcedimiento(null);
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar todo
          </button>
        </div>
      )}

      <StatsRow stats={stats} />
      <StatsCharts stats={stats} />

      <CirugiasTable rows={rows} loading={loading} error={error} />
    </div>
  );
}
