import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { RadiografiaMeta } from "@/lib/types";

export const ACCEPTED_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "heic",
  "heif",
] as const;

export async function listRadiografias(
  cirugiaId: number,
): Promise<RadiografiaMeta[]> {
  return invoke<RadiografiaMeta[]>("radiografia_list", { cirugiaId });
}

export async function uploadRadiografia(
  cirugiaId: number,
  sourcePath: string,
  caption: string | null,
): Promise<number> {
  return invoke<number>("radiografia_upload", {
    cirugiaId,
    sourcePath,
    caption,
  });
}

export async function fetchRadiografiaBytes(
  id: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const arr = await invoke<number[]>("radiografia_bytes", { id });
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return new Uint8Array(arr);
}

export async function updateRadiografiaCaption(
  id: number,
  caption: string | null,
): Promise<void> {
  await invoke("radiografia_update_caption", { id, caption });
}

export async function deleteRadiografia(id: number): Promise<void> {
  await invoke("radiografia_delete", { id });
}

export async function pickImageFiles(): Promise<string[]> {
  const picked = await open({
    multiple: true,
    filters: [
      {
        name: "Imágenes",
        extensions: [...ACCEPTED_IMAGE_EXTENSIONS],
      },
    ],
  });
  if (!picked) return [];
  return Array.isArray(picked) ? picked : [picked];
}

export function filenameFromPath(path: string): string {
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}

export function hasAcceptedExtension(path: string): boolean {
  const lower = path.toLowerCase();
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith("." + ext));
}
