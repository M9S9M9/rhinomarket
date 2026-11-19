import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/gmail";

/**
 * Finds the account that belongs to an inbox, whatever spelling was typed.
 * "J.Doe+shop@googlemail.com" and "jdoe@gmail.com" are the same Gmail inbox.
 * Also matches accounts created before addresses were stored in normalized form.
 */
export async function findUserByInbox(typed: string) {
  const normalized = normalizeEmail(typed);
  const direct =
    (await prisma.user.findUnique({ where: { email: normalized } })) ||
    (await prisma.user.findUnique({ where: { email: typed.trim().toLowerCase() } }));
  if (direct) return direct;
  if (!normalized.endsWith("@gmail.com")) return null;

  // Older rows may hold dotted / +tagged / googlemail spellings of the same inbox.
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM users
    WHERE lower(split_part(email, '@', 2)) IN ('gmail.com', 'googlemail.com')
      AND replace(split_part(lower(split_part(email, '@', 1)), '+', 1), '.', '') || '@gmail.com' = ${normalized}
    ORDER BY ("emailVerified" IS NULL), "createdAt"
    LIMIT 1`;
  return rows[0] ? prisma.user.findUnique({ where: { id: rows[0].id } }) : null;
}
