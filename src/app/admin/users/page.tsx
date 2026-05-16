"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Shield, Key, Ban, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string; name: string | null; email: string;
  role: string; isActive: boolean; emailVerified: string | null;
  createdAt: string; stripeOnboarding: boolean;
  _count: { listings: number; purchases: number };
}

const roles = ["BUYER", "DESIGNER", "ADMIN"];

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "BUYER" });
  const [editForm, setEditForm] = useState({ name: "", role: "BUYER", password: "" });
  const user = session?.user as any;

  const fetchUsers = () => fetch("/api/admin/users").then(r => r.json()).then(setUsers).catch(() => {});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchUsers();
  }, [status, router, user?.role]);

  const handleAdd = async () => {
    if (!form.email || !form.password) { toast.error("Email and password required"); return; }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("User created");
        setShowAdd(false);
        setForm({ email: "", name: "", password: "", role: "BUYER" });
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch { toast.error("Failed to create user"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      const body: any = {};
      if (editForm.name) body.name = editForm.name;
      if (editForm.role) body.role = editForm.role;
      if (editForm.password) body.password = editForm.password;
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("User updated");
        setEditId(null);
        setEditForm({ name: "", role: "BUYER", password: "" });
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch { toast.error("Failed to update user"); }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (res.ok) { toast.success(u.isActive ? "User restricted" : "User activated"); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed"); }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt("Enter new password (min 6 chars):");
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) toast.success("Password reset");
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("User deleted"); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to delete user"); }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { toast.success(`Role changed to ${newRole}`); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed"); }
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-1">Add, edit, restrict, and manage platform users</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add User</Button>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add User</h2>
            <div className="space-y-3">
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <input type="text" placeholder="Name (optional)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd}>Create User</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit User</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="password" placeholder="New password (leave blank to keep current)" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditId(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => handleUpdate(editId)}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Stripe</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Listings</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Purchases</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{u.name || "—"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={u.role}
                    onChange={e => handleChangeRole(u.id, e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="py-3 px-4">{u.stripeOnboarding ? "✓" : "—"}</td>
                <td className="py-3 px-4">{u._count.listings}</td>
                <td className="py-3 px-4">{u._count.purchases}</td>
                <td className="py-3 px-4 text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditId(u.id); setEditForm({ name: u.name || "", role: u.role, password: "" }); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Edit">
                      <Shield className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleResetPassword(u.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600" title="Reset password">
                      <Key className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleToggleActive(u)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-orange-600" title={u.isActive ? "Restrict" : "Activate"}>
                      {u.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleDelete(u.id, u.email)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
