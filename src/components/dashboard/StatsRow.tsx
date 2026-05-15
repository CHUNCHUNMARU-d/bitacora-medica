import type { Stats } from "@/hooks/useStats";

export function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-b border-border py-4">
      <Metric value={String(stats.total)} label="cirugías" />
      <Divider />
      <Metric value={String(stats.esteMes)} label="este mes" />
      <Divider />
      <Metric
        value={stats.topProcedimiento ?? "—"}
        label="más frecuente"
        truncate
      />
    </div>
  );
}

function Divider() {
  return <span className="hidden h-6 w-px self-center bg-border md:block" />;
}

function Metric({
  value,
  label,
  truncate,
}: {
  value: string;
  label: string;
  truncate?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className={
          "text-2xl font-semibold tracking-tight tabular-nums" +
          (truncate ? " max-w-52 truncate" : "")
        }
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
