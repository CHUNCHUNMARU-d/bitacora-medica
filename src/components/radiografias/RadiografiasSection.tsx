import { ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useFileDrop } from "@/hooks/useFileDrop";
import { useRadiografias } from "@/hooks/useRadiografias";
import { pickImageFiles } from "@/lib/radiografias";
import { cn } from "@/lib/utils";
import { RadiografiaCard } from "./RadiografiaCard";
import { RadiografiaLightbox } from "./RadiografiaLightbox";

interface Props {
  cirugiaId: number;
}

export function RadiografiasSection({ cirugiaId }: Props) {
  const { items, loading, error, upload, remove, setCaption } =
    useRadiografias(cirugiaId);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const uploadMany = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;
      setUploading(true);
      let okCount = 0;
      for (const p of paths) {
        try {
          await upload(p, null);
          okCount += 1;
        } catch (e) {
          toast.error(`Error al subir: ${e}`);
        }
      }
      setUploading(false);
      if (okCount > 0) {
        toast.success(
          okCount === 1
            ? "Radiografía subida"
            : `${okCount} radiografías subidas`,
        );
      }
    },
    [upload],
  );

  const onPickClick = useCallback(async () => {
    try {
      const paths = await pickImageFiles();
      await uploadMany(paths);
    } catch (e) {
      toast.error(`Error al seleccionar: ${e}`);
    }
  }, [uploadMany]);

  const { isDragOver, dropZoneRef } = useFileDrop({
    onDrop: (paths) => void uploadMany(paths),
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Radiografías
        </h2>
        <button
          type="button"
          onClick={onPickClick}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} />
          ) : (
            <ImagePlus className="size-3.5" strokeWidth={1.5} />
          )}
          Agregar
        </button>
      </div>

      <div
        ref={dropZoneRef}
        className={cn(
          "relative rounded-md border border-dashed border-border bg-muted/30 p-3 transition-colors duration-100",
          isDragOver && "border-ring bg-muted/60",
        )}
      >
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-md bg-background/85 text-sm font-medium text-foreground">
            Suelta para subir
          </div>
        )}

        {loading && items.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            Cargando radiografías…
          </p>
        )}
        {error && (
          <p className="px-1 py-6 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <button
            type="button"
            onClick={onPickClick}
            disabled={uploading}
            className="block w-full px-1 py-8 text-center text-xs text-muted-foreground transition-colors duration-100 hover:text-foreground"
          >
            Arrastra imágenes aquí o haz clic en Agregar
          </button>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <RadiografiaCard
                key={item.id}
                item={item}
                onOpen={() => setLightboxIndex(i)}
                onDelete={() => {
                  void (async () => {
                    try {
                      await remove(item.id);
                      toast.success("Radiografía eliminada");
                    } catch (e) {
                      toast.error(`Error al eliminar: ${e}`);
                    }
                  })();
                }}
                onEditCaption={(caption) => {
                  void (async () => {
                    try {
                      await setCaption(item.id, caption || null);
                    } catch (e) {
                      toast.error(`Error al guardar descripción: ${e}`);
                    }
                  })();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && items[lightboxIndex] && (
        <RadiografiaLightbox
          items={items}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </section>
  );
}
