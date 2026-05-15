import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRadiografiaBlobUrl } from "@/hooks/useRadiografiaBlobUrl";
import type { RadiografiaMeta } from "@/lib/types";

interface Props {
  items: RadiografiaMeta[];
  index: number;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}

export function RadiografiaLightbox({
  items,
  index,
  onClose,
  onChangeIndex,
}: Props) {
  const current = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onChangeIndex(index - 1);
      else if (e.key === "ArrowRight" && index < items.length - 1)
        onChangeIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, items.length, onChangeIndex, onClose]);

  if (!current) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption ?? current.filename}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/10 text-white/90 transition-colors duration-100 hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X className="size-5" strokeWidth={1.5} />
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeIndex(index - 1);
          }}
          className="absolute left-5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/90 transition-colors duration-100 hover:bg-white/20"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-6" strokeWidth={1.5} />
        </button>
      )}
      {index < items.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeIndex(index + 1);
          }}
          className="absolute right-5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/90 transition-colors duration-100 hover:bg-white/20"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-6" strokeWidth={1.5} />
        </button>
      )}

      <LightboxImage key={current.id} item={current} />

      {current.caption && (
        <p className="absolute bottom-6 left-1/2 max-w-[80vw] -translate-x-1/2 truncate text-center text-sm text-white/80">
          {current.caption}
        </p>
      )}
    </div>,
    document.body,
  );
}

function LightboxImage({ item }: { item: RadiografiaMeta }) {
  const { url, loading, error } = useRadiografiaBlobUrl(item.id, item.mime_type);
  return (
    <div
      className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {url && (
        <img
          src={url}
          alt={item.caption ?? item.filename}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      )}
      {loading && !url && (
        <p className="text-sm text-white/60">Cargando…</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
