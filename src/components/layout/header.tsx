"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Upload, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string; type: string; title: string; message: string | null;
  link: string | null; read: boolean; createdAt: string;
}

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isDesigner = user?.role === "DESIGNER";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then(r => r.json())
        .then(data => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="3DM Store" className="h-10 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Browse
            </Link>
            <Link href="/marketplace?sort=popular" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Popular
            </Link>
            <Link href="/categories" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Categories
            </Link>
            {isDesigner && (
              <Link href="/dashboard/designer" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Studio
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Link href="/marketplace" className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="h-5 w-5" />
            </Link>

            {session ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-[70vh] flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
                        ) : (
                          notifications.slice(0, 20).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "#"}
                              onClick={() => { if (!n.read) markRead(n.id); setNotifOpen(false); }}
                              className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                            >
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Favorites */}
                <Link href="/dashboard/favorites" className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Heart className="h-5 w-5" />
                </Link>

                {/* Upload */}
                {isDesigner && (
                  <Link href="/dashboard/designer/upload">
                    <Button size="sm" className="hidden sm:flex gap-1.5">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          Dashboard
                        </Link>
                        <Link href="/dashboard/purchases" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          My Purchases
                        </Link>
                        <Link href="/dashboard/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          Favorites
                        </Link>
                        {isDesigner && (
                          <>
                            <Link href="/dashboard/designer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                              Designer Studio
                            </Link>
                            <Link href="/dashboard/designer/earnings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                              Earnings
                            </Link>
                          </>
                        )}
                        {isAdmin && (
                          <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100" onClick={() => setUserMenuOpen(false)}>
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => signOut()}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link href="/marketplace" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
            <Link href="/marketplace?sort=popular" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Popular</Link>
            <Link href="/categories" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Categories</Link>
            {session && isDesigner && (
              <Link href="/dashboard/designer/upload" className="block py-2 text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                Upload Model
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}