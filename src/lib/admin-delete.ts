// Admin "hard delete" for listings and users.
//
// Deletes the record together with everything that points to it (payment
// records, downloads, disputes, reviews...). Abandoned checkouts (PENDING /
// FAILED) are removed silently. Real orders — a buyer submitted or completed a
// payment — are only removed when the admin confirms (force = true), because
// those buyers lose their download and the sale disappears from the records.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteModelFile } from "@/lib/upload";

const REAL_ORDER = ["SUBMITTED", "COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;

export type DeleteResult =
  | { ok: true }
  | { ok: false; confirmRequired: true; paidOrders: number; listings?: number };

type Tx = Prisma.TransactionClient;

async function removeTransactions(tx: Tx, where: Prisma.TransactionWhereInput) {
  const txs = await tx.transaction.findMany({ where, select: { id: true } });
  const ids = txs.map((t) => t.id);
  if (ids.length === 0) return;
  await tx.dispute.deleteMany({ where: { transactionId: { in: ids } } });
  await tx.download.deleteMany({ where: { transactionId: { in: ids } } });
  await tx.transaction.deleteMany({ where: { id: { in: ids } } });
}

async function removeListings(tx: Tx, listingIds: string[]) {
  if (listingIds.length === 0) return;
  await tx.dMCAReport.updateMany({ where: { listingId: { in: listingIds } }, data: { listingId: null } });
  await removeTransactions(tx, { listingId: { in: listingIds } });
  await tx.download.deleteMany({ where: { listingId: { in: listingIds } } });
  // reviews and favorites are removed by the database (onDelete: Cascade)
  await tx.listing.deleteMany({ where: { id: { in: listingIds } } });
}

async function removeFiles(fileUrls: (string | null)[]) {
  for (const url of fileUrls) if (url) await deleteModelFile(url);
}

export async function deleteListingCompletely(listingId: string, force: boolean): Promise<DeleteResult> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { fileUrl: true } });
  if (!listing) return { ok: true };

  const paidOrders = await prisma.transaction.count({
    where: { listingId, status: { in: [...REAL_ORDER] } },
  });
  if (paidOrders > 0 && !force) return { ok: false, confirmRequired: true, paidOrders };

  await prisma.$transaction((tx) => removeListings(tx, [listingId]), { timeout: 30_000 });
  await removeFiles([listing.fileUrl]);
  return { ok: true };
}

export async function deleteUserCompletely(userId: string, force: boolean): Promise<DeleteResult> {
  const listings = await prisma.listing.findMany({ where: { designerId: userId }, select: { id: true, fileUrl: true } });
  const listingIds = listings.map((l) => l.id);

  const paidOrders = await prisma.transaction.count({
    where: {
      status: { in: [...REAL_ORDER] },
      OR: [{ buyerId: userId }, { designerId: userId }, { listingId: { in: listingIds } }],
    },
  });
  if (paidOrders > 0 && !force) {
    return { ok: false, confirmRequired: true, paidOrders, listings: listingIds.length };
  }

  await prisma.$transaction(
    async (tx) => {
      await removeListings(tx, listingIds);
      await removeTransactions(tx, { OR: [{ buyerId: userId }, { designerId: userId }] });
      await tx.download.deleteMany({ where: { userId } });
      await tx.dispute.deleteMany({ where: { raisedById: userId } });
      await tx.dispute.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
      await tx.review.deleteMany({ where: { OR: [{ designerId: userId }, { reviewerId: userId }] } });
      await tx.supportMessage.deleteMany({ where: { senderId: userId } });
      // everything else (tickets, earnings, wallet, notifications, follows...) cascades
      await tx.user.delete({ where: { id: userId } });
    },
    { timeout: 30_000 }
  );
  await removeFiles(listings.map((l) => l.fileUrl));
  return { ok: true };
}
