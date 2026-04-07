import { del, put } from "@vercel/blob";
import { unlink } from "fs/promises";
import { createHash, randomBytes } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { uploadAbsolutePath } from "@/lib/uploads";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function storeUpload(
  bytes: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ storedPath: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const ext = path.extname(originalName) || guessExt(mimeType);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const unique = randomBytes(4).toString("hex");
    const pathname = `receipts/${hash}-${unique}${ext}`;
    const blob = await put(pathname, bytes, {
      access: "public",
      token,
      contentType: mimeType || "application/octet-stream",
    });
    return { storedPath: blob.url };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalName) || guessExt(mimeType);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const unique = randomBytes(4).toString("hex");
  const filename = `${hash}-${unique}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return { storedPath: filename };
}

export async function readUploadBuffer(storedPath: string): Promise<Buffer | null> {
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    const res = await fetch(storedPath);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    const { readFile } = await import("fs/promises");
    return await readFile(uploadAbsolutePath(storedPath));
  } catch {
    return null;
  }
}

export async function removeUpload(storedPath: string): Promise<void> {
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      await del(storedPath, { token });
    }
    return;
  }
  try {
    await unlink(uploadAbsolutePath(storedPath));
  } catch {
    /* ignore */
  }
}

function guessExt(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return "";
}
