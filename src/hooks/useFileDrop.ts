import { useEffect, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { hasAcceptedExtension } from "@/lib/radiografias";

interface UseFileDropOptions {
  onDrop: (paths: string[]) => void;
  enabled?: boolean;
}

export function useFileDrop({ onDrop, enabled = true }: UseFileDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    if (!enabled) {
      setIsDragOver(false);
      return;
    }
    let disposed = false;
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (disposed) return;
      const zone = dropZoneRef.current;
      if (!zone) return;

      if (event.payload.type === "over" || event.payload.type === "enter") {
        const { position } = event.payload;
        if (!position) return;
        const rect = zone.getBoundingClientRect();
        const inside =
          position.x >= rect.left &&
          position.x <= rect.right &&
          position.y >= rect.top &&
          position.y <= rect.bottom;
        setIsDragOver(inside);
      } else if (event.payload.type === "drop") {
        const { position, paths } = event.payload;
        if (!position) {
          setIsDragOver(false);
          return;
        }
        const rect = zone.getBoundingClientRect();
        const inside =
          position.x >= rect.left &&
          position.x <= rect.right &&
          position.y >= rect.top &&
          position.y <= rect.bottom;
        setIsDragOver(false);
        if (inside) {
          const accepted = paths.filter(hasAcceptedExtension);
          if (accepted.length > 0) onDropRef.current(accepted);
        }
      } else {
        setIsDragOver(false);
      }
    });
    return () => {
      disposed = true;
      void unlisten.then((u) => u()).catch(() => undefined);
    };
  }, [enabled]);

  return { isDragOver, dropZoneRef };
}
