/**
 * Registration is limited to Gmail addresses.
 *
 * Gmail ignores dots in the name and anything after "+", and googlemail.com is the
 * same mailbox as gmail.com — so "J.Doe+shop@googlemail.com" and "jdoe@gmail.com"
 * are one inbox. We store the canonical form so one inbox = one account.
 */
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function isGmailAddress(email: string): boolean {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return false;
  return GMAIL_DOMAINS.has(email.trim().slice(at + 1).toLowerCase());
}

/** Lower-cases any email; for Gmail also removes dots and +tags and uses gmail.com. */
export function normalizeEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (!GMAIL_DOMAINS.has(domain)) return e;
  local = local.split("+")[0].replace(/\./g, "");
  return `${local}@gmail.com`;
}

/** The address as the person wrote it, tidied (trimmed, lower-case), for display only. */
export function displayEmail(typed: string): string {
  return typed.trim().toLowerCase();
}
