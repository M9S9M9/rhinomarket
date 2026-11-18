"use client";

import toast from "react-hot-toast";

export async function adminDeleteListing(id: string): Promise<boolean> {
  let res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
  let d = await res.json().catch(() => ({}));
  if (res.status === 409 && d.confirmRequired) {
    if (!confirm(`This listing has ${d.paidOrders} paid order(s). Deleting it also deletes those orders, and the buyers will lose their downloads. Delete anyway?`)) return false;
    res = await fetch(`/api/listings/${id}?force=1`, { method: "DELETE" });
    d = await res.json().catch(() => ({}));
  }
  if (res.ok) { toast.success("Listing deleted"); return true; }
  toast.error(d.error || "Failed to delete");
  return false;
}

export async function adminDeleteUser(id: string): Promise<boolean> {
  let res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  let d = await res.json().catch(() => ({}));
  if (res.status === 409 && d.confirmRequired) {
    if (!confirm(`This user has ${d.paidOrders} paid order(s)${d.listings ? ` and ${d.listings} listing(s)` : ""}. Deleting the user also deletes those orders and listings. Delete anyway?`)) return false;
    res = await fetch(`/api/admin/users/${id}?force=1`, { method: "DELETE" });
    d = await res.json().catch(() => ({}));
  }
  if (res.ok) { toast.success("User deleted"); return true; }
  toast.error(d.error || "Failed to delete user");
  return false;
}
