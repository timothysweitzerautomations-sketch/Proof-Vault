import { prisma } from "@/lib/prisma";
import { daysUntilUtc, utcDateKey } from "@/lib/dates";
import { Resend } from "resend";

function appBaseUrl() {
  const explicit = process.env.APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function verifyCronToken(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!verifyCronToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const resend = apiKey ? new Resend(apiKey) : null;

  const receipts = await prisma.receipt.findMany({
    where: {
      coverage: { isNot: null },
      reminders: { some: {} },
      user: { email: { not: null } },
    },
    include: {
      coverage: true,
      reminders: true,
      user: { select: { email: true, name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const receipt of receipts) {
    if (!receipt.coverage || !receipt.user.email) continue;

    const daysLeft = daysUntilUtc(receipt.coverage.endsAt);
    const coverageEndKey = utcDateKey(receipt.coverage.endsAt);

    for (const reminder of receipt.reminders) {
      if (reminder.offsetDays !== daysLeft) continue;

      const existing = await prisma.reminderDispatch.findFirst({
        where: {
          receiptId: receipt.id,
          offsetDays: reminder.offsetDays,
          coverageEndKey,
        },
      });
      if (existing) {
        skipped++;
        continue;
      }

      if (!resend || !from) {
        skipped++;
        continue;
      }

      const base = appBaseUrl();
      const link = `${base}/receipts/${receipt.id}`;
      const subject = `Warranty reminder: ${receipt.merchant} (${reminder.offsetDays} days left)`;
      const html = `
        <p>Hi${receipt.user.name ? ` ${receipt.user.name.split(" ")[0]}` : ""},</p>
        <p>Your coverage for <strong>${receipt.merchant}</strong> ends on
        <strong>${receipt.coverage.endsAt.toLocaleDateString()}</strong>
        (about <strong>${reminder.offsetDays}</strong> days from the day this reminder is sent).</p>
        <p><a href="${link}">Open this receipt in Proof Vault</a></p>
        <p style="color:#666;font-size:12px">You get one email per reminder offset per coverage end date.</p>
      `;

      const { error } = await resend.emails.send({
        from,
        to: receipt.user.email,
        subject,
        html,
      });

      if (error) {
        console.error("[cron/reminders] Resend error", error);
        continue;
      }

      try {
        await prisma.reminderDispatch.create({
          data: {
            receiptId: receipt.id,
            offsetDays: reminder.offsetDays,
            coverageEndKey,
          },
        });
      } catch {
        skipped++;
        continue;
      }
      sent++;
    }
  }

  const payload = {
    ok: true,
    receipts: receipts.length,
    emailsSent: sent,
    skipped,
    resendConfigured: Boolean(apiKey && from),
  };

  return Response.json(payload);
}
