import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveUploadedFile(
  bytes: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ storedPath: string; absolutePath: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalName) || guessExt(mimeType);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const unique = randomBytes(4).toString("hex");
  const filename = `${hash}-${unique}${ext}`;
  const absolutePath = path.join(UPLOAD_DIR, filename);
  await writeFile(absolutePath, bytes);
  return { storedPath: filename, absolutePath };
}

function guessExt(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return "";
}

export function uploadAbsolutePath(storedPath: string): string {
  return path.join(UPLOAD_DIR, storedPath);
}
