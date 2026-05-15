import { ImagePlus, X } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useFileDrop } from "@/hooks/useFileDrop";
import {
  filenameFromPath,
  pickImageFiles,
} from "@/lib/radiografias";
import type { PendingRadiografia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: PendingRadiografia[];
  onChange: (next: PendingRadiografia[]) => void;
  disabled?: boolean;
}

export function RadiografiaPicker({ value, onChange, disabled }: Props) {
  const append = useCallback(
    (paths: string[]) => {
      if (paths.length === 0) return;
      const existing = new Set(value.map((v) => v.source_path));
      const additions: PendingRadiografia[] = [];
      for (const p of paths) {
        if (existing.has(p)) continue;
        additions.push({
          source_path: p,
          filename: filenameFromPath(p),
          caption: "",
        });
      }
      if (additions.length > 0) onChange([...value, ...additions]);
    },
    [value, onChange],
  );

  const onPickClick = useCallback(async () => {
    try {
      const paths = await pickImageFiles();
      append(paths);
    } catch (e) {
      toast.error(`Error al seleccionar: ${e}`);
    }
  }, [append]);

  const { isDragOver, dropZoneRef } = useFileDrop({
    onDrop: append,
    enabled: !disabled,
  });

  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Radiografías (opcional)
        </p>
        <button
          type="button"
          onClick={onPickClick}
          disabled={disabled}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" strokeWidth={1.5} />
          Agregar
        </button>
      </div>

      <div
        ref={dropZoneRef}
        className={cn(
          "relative rounded-md border border-dashed border-border bg-muted/30 transition-colors duration-100",
          isDragOver && "border-ring bg-muted/60",
        )}
      >
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-md bg-background/85 text-sm font-medium text-foreground">
            Suelta para añadir
          </div>
        )}

        {value.length === 0 ? (
          <button
            type="button"
            onClick={onPickClick}
            disabled={disabled}
            className="block w-full px-3 py-6 text-center text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground disabled:opacity-50"
          >
            Arrastra imágenes aquí o haz clic en Agregar
          </button>
        ) : (
          <ul className="divide-y divide-border">
            {value.map((pending, idx) => (
              <li
                key={pending.source_path}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span className="flex-1 truncate text-sm">
                  {pending.filename}
                </span>
                <input
                  type="text"
                  value={pending.caption}
                  maxLength={200}
                  onChange={(e) => {
                    const next = [...value];
                    next[idx] = { ...pending, caption: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Descripción"
                  className="w-44 rounded-sm bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus:text-foreground"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((_, i) => i !== idx))
                  }
                  className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors duration-100 hover:text-destructive"
                  aria-label="Quitar"
                >
                  <X className="size-3.5" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
