import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRadiografiaBlobUrl } from "@/hooks/useRadiografiaBlobUrl";
import type { RadiografiaMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  item: RadiografiaMeta;
  onOpen: () => void;
  onDelete: () => void;
  onEditCaption: (caption: string) => void;
}

export function RadiografiaCard({
  item,
  onOpen,
  onDelete,
  onEditCaption,
}: Props) {
  const { url, loading, error } = useRadiografiaBlobUrl(item.id, item.mime_type);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.caption ?? "");

  return (
    <div className="group flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "relative block aspect-square overflow-hidden rounded-md border border-border bg-muted transition-colors duration-100",
          "hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={item.caption ?? item.filename}
      >
        {url && (
          <img
            src={url}
            alt={item.caption ?? item.filename}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
        {loading && !url && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-destructive">
            {error}
          </div>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(`¿Eliminar "${item.caption ?? item.filename}"?`)
            ) {
              onDelete();
            }
          }}
          className="absolute right-1.5 top-1.5 grid size-7 cursor-pointer place-items-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition-opacity duration-100 hover:text-destructive group-hover:opacity-100"
          aria-label="Eliminar radiografía"
          role="button"
          tabIndex={-1}
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
        </span>
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const next = draft.trim();
            if (next !== (item.caption ?? "")) {
              onEditCaption(next);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(item.caption ?? "");
              setEditing(false);
            }
          }}
          maxLength={200}
          placeholder="Añadir descripción"
          className="bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus:text-foreground"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(item.caption ?? "");
            setEditing(true);
          }}
          className="truncate text-left text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground"
          title="Editar descripción"
        >
          {item.caption ?? "Añadir descripción"}
        </button>
      )}
    </div>
  );
}
