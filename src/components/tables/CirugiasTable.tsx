import { BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Cirugia } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  rows: Cirugia[];
  loading?: boolean;
  error?: string | null;
}

const SKELETON_WIDTHS = [
  ["w-20", "w-36", "w-16", "w-48", "w-28"],
  ["w-24", "w-44", "w-14", "w-56", "w-24"],
  ["w-20", "w-32", "w-16", "w-52", "w-32"],
  ["w-24", "w-40", "w-14", "w-44", "w-28"],
  ["w-20", "w-36", "w-16", "w-60", "w-24"],
  ["w-24", "w-44", "w-14", "w-48", "w-28"],
];

export function CirugiasTable({ rows, loading, error }: Props) {
  const navigate = useNavigate();

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Edad / Sexo</TableHead>
            <TableHead>Procedimiento</TableHead>
            <TableHead>Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SKELETON_WIDTHS.map((widths, i) => (
            <TableRow key={i} className="pointer-events-none">
              {widths.map((w, j) => (
                <TableCell key={j}>
                  <div className={`h-4 animate-pulse rounded bg-muted ${w}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <BookOpen className="size-10 text-muted-foreground/40" strokeWidth={1} />
        <div>
          <p className="text-sm font-medium">Ninguna cirugía registrada</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Crea tu primer registro desde Nueva cirugía
          </p>
        </div>
        <Link
          to="/nueva"
          className="mt-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Nueva cirugía
        </Link>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Edad / Sexo</TableHead>
          <TableHead>Procedimiento</TableHead>
          <TableHead>Rol</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow
            key={c.id}
            className="cursor-pointer transition-colors duration-100 hover:bg-muted/60"
            onClick={() => navigate(`/cirugia/${c.id}`)}
          >
            <TableCell className="text-sm text-muted-foreground tabular-nums">
              {c.fecha_cirugia}
            </TableCell>
            <TableCell>{c.nombre_paciente}</TableCell>
            <TableCell>
              {c.edad} / {c.sexo}
            </TableCell>
            <TableCell>{c.procedimiento_quirurgico}</TableCell>
            <TableCell>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {c.rol_cirujano}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
