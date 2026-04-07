import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import { readUploadBuffer } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const file = await prisma.receiptFile.findFirst({
    where: {
      id,
      receipt: { userId: session.user.id },
    },
  });

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await readUploadBuffer(file.storedPath);
  if (!bytes) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(file.originalName).toLowerCase();
  const type =
    file.mimeType && file.mimeType !== "application/octet-stream"
      ? file.mimeType
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".pdf"
              ? "application/pdf"
              : "application/octet-stream";

  return new Response(Uint8Array.from(bytes), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
