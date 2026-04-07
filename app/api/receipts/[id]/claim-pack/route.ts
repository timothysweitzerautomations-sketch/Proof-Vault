import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { readUploadBuffer } from "@/lib/storage";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: session.user.id },
    include: { lineItems: true, files: true, coverage: true, reminders: true },
  });

  if (!receipt) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let page = pdf.addPage();
  let { width, height } = page.getSize();
  let y = height - margin;

  const draw = (text: string, size: number, bold = false, lineGap = 14) => {
    const f = bold ? fontBold : font;
    if (y < margin + 40) {
      page = pdf.addPage();
      ({ width, height } = page.getSize());
      y = height - margin;
    }
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= lineGap;
  };

  draw("Proof Vault — claim packet", 18, true, 28);
  draw(`Generated: ${new Date().toLocaleString()}`, 10, false, 22);
  draw(`Merchant: ${receipt.merchant}`, 12, true, 20);
  draw(`Purchase date: ${receipt.purchasedAt.toLocaleDateString()}`, 11, false, 18);
  draw(`Total: ${formatMoney(receipt.totalCents, receipt.currency)}`, 11, false, 18);
  if (receipt.supportUrl) draw(`Support / claim URL: ${receipt.supportUrl}`, 10, false, 18);
  if (receipt.notes) draw(`Notes: ${receipt.notes}`, 10, false, 18);

  y -= 8;
  draw("Coverage", 12, true, 20);
  if (receipt.coverage) {
    draw(
      `Starts: ${receipt.coverage.startsAt.toLocaleDateString()} · Ends: ${receipt.coverage.endsAt.toLocaleDateString()} (${receipt.coverage.type})`,
      10,
      false,
      18
    );
  } else {
    draw("No coverage dates on file.", 10, false, 18);
  }

  if (receipt.reminders.length > 0) {
    draw(
      `Reminder offsets (days before end): ${receipt.reminders.map((r) => r.offsetDays).join(", ")}`,
      10,
      false,
      18
    );
  }

  y -= 8;
  draw("Line items", 12, true, 20);
  if (receipt.lineItems.length === 0) {
    draw("No line items captured.", 10, false, 18);
  } else {
    for (const li of receipt.lineItems) {
      const bits = [
        li.name,
        `×${li.quantity}`,
        li.priceCents != null ? formatMoney(li.priceCents, receipt.currency) : null,
        li.sku ? `SKU ${li.sku}` : null,
        li.serial ? `Serial ${li.serial}` : null,
      ].filter(Boolean);
      draw(bits.join(" · "), 10, false, 16);
    }
  }

  y -= 16;
  draw("Attachments", 12, true, 20);
  for (const file of receipt.files) {
    draw(`· ${file.originalName} (${file.mimeType})`, 10, false, 16);
  }

  y -= 16;
  draw("Checklist (fill in before submitting a claim)", 12, true, 22);
  const checklist = [
    "Photos of the issue / damage",
    "Serial number (if applicable)",
    "Case / ticket ID from manufacturer",
    "Return authorization (if required)",
  ];
  for (const c of checklist) {
    draw(`☐ ${c}`, 10, false, 18);
  }

  for (const file of receipt.files) {
    const fileBytes = await readUploadBuffer(file.storedPath);
    if (!fileBytes) continue;

    if (file.mimeType === "application/pdf" || file.originalName.toLowerCase().endsWith(".pdf")) {
      try {
        const attached = await PDFDocument.load(Uint8Array.from(fileBytes));
        const copied = await pdf.copyPages(attached, attached.getPageIndices());
        copied.forEach((p) => pdf.addPage(p));
        ({ width, height } = pdf.getPage(pdf.getPageCount() - 1).getSize());
        page = pdf.getPage(pdf.getPageCount() - 1);
        y = margin + 24;
        page.drawText(`[Attached PDF: ${file.originalName}]`, {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
      } catch {
        const newPage = pdf.addPage();
        page = newPage;
        ({ width, height } = page.getSize());
        y = height - margin;
        page.drawText(`(Could not embed PDF: ${file.originalName})`, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.5, 0.2, 0.2),
        });
      }
    } else if (file.mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.originalName)) {
      let image;
      try {
        if (file.mimeType === "image/png" || file.originalName.toLowerCase().endsWith(".png")) {
          image = await pdf.embedPng(Uint8Array.from(fileBytes));
        } else if (
          file.mimeType === "image/jpeg" ||
          file.mimeType === "image/jpg" ||
          /\.jpe?g$/i.test(file.originalName)
        ) {
          image = await pdf.embedJpg(Uint8Array.from(fileBytes));
        } else {
          continue;
        }
      } catch {
        continue;
      }

      const imgPage = pdf.addPage();
      page = imgPage;
      const iw = image.width;
      const ih = image.height;
      const maxW = width - margin * 2;
      const maxH = height - margin * 2;
      const scale = Math.min(maxW / iw, maxH / ih, 1);
      const dw = iw * scale;
      const dh = ih * scale;
      const x = (width - dw) / 2;
      const py = (height - dh) / 2;
      imgPage.drawImage(image, { x, y: py, width: dw, height: dh });
      imgPage.drawText(file.originalName, {
        x: margin,
        y: margin / 2,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    }
  }

  const out = await pdf.save();
  const filename = `claim-pack-${receipt.merchant.replace(/[^\w\d]+/g, "-").slice(0, 40)}-${id.slice(0, 8)}.pdf`;

  return new Response(Buffer.from(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
