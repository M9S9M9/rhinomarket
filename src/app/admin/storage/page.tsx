"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ArrowLeft } from "lucide-react";

interface StorageStatus {
  privateStoreConfigured: boolean;
  publicModels: number;
  privateModels: number;
  blobEnvNames?: string[];
  vercelEnv?: string;
}

export default function AdminStoragePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [info, setInfo] = useState<StorageStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/storage/migrate-models");
    if (res.ok) setInfo(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") load();
  }, [status, user?.role, router, load]);

  async function migrate() {
    setRunning(true);
    setLog([]);
    try {
      for (let round = 0; round < 500; round++) {
        const res = await fetch("/api/admin/storage/migrate-models", { method: "POST" });
        const data = await res.json();
        if (!res.ok) { setLog((l) => [...l, `Error: ${data.error}`]); break; }
        const lines: string[] = [];
        if (data.migrated) lines.push(`Moved ${data.migrated} file(s) to private storage.`);
        for (const f of data.failed || []) lines.push(`Could not move "${f.title}": ${f.error}`);
        setLog((l) => [...l, ...lines]);
        await load();
        if (!data.remaining) break;
      }
      setLog((l) => [...l, "Done."]);
    } catch (err: any) {
      setLog((l) => [...l, `Error: ${err?.message || err}`]);
    } finally {
      setRunning(false);
    }
  }

  if (status === "loading" || !info) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Model file storage</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <Lock className="h-5 w-5 text-green-600 mb-2" />
          <p className="text-3xl font-bold">{info.privateModels}</p>
          <p className="text-sm text-gray-500">Model files in private storage</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Unlock className="h-5 w-5 text-amber-600 mb-2" />
          <p className="text-3xl font-bold">{info.publicModels}</p>
          <p className="text-sm text-gray-500">Model files still in public storage</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        {!info.privateStoreConfigured ? (
          <>
          <p className="text-sm text-red-600">
            The private store isn&apos;t connected to this deployment yet. In Vercel, connect a Private Blob
            store with the prefix <code>BLOB_MODELS</code>, then redeploy.
          </p>
          <p className="text-xs text-gray-500">
            Storage settings this deployment ({info.vercelEnv}) can see:{" "}
            {info.blobEnvNames && info.blobEnvNames.length > 0 ? info.blobEnvNames.join(", ") : "none"}
          </p>
          </>
        ) : info.publicModels === 0 ? (
          <p className="text-sm text-green-700">All model files are private. New uploads go to private storage automatically.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Moves every model file into private storage and deletes the public copy, so old links stop working.
              Previews and avatars are not touched. Keep this page open until it says Done.
            </p>
            <Button onClick={migrate} loading={running} disabled={running}>
              Move {info.publicModels} file(s) to private storage
            </Button>
          </>
        )}
        {log.length > 0 && (
          <pre className="text-xs bg-gray-50 border rounded p-3 whitespace-pre-wrap">{log.join("\n")}</pre>
        )}
      </CardContent></Card>
    </div>
  );
}
