"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const [form, setForm] = useState({
    title: "", description: "", price: "", licenseType: "PERSONAL",
    categoryId: "", tags: "", polyCount: "", rhinocerosVersion: "8",
    copyrightConfirmed: false,
  });

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }
  if (user?.role !== "DESIGNER") { router.push("/dashboard"); return null; }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".3dm")) { toast.error("Only .3dm files are allowed"); return; }
      if (file.size > 500 * 1024 * 1024) { toast.error("File too large (max 500MB)"); return; }
      setModelFile(file);
    }
  };

  const handlePreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPreviews(prev => [...prev, ...files].slice(0, 10));
  };

  const handleUpload = async () => {
    if (!modelFile) { toast.error("Please select a .3dm file"); return; }
    setUploading(true);

    const formData = new FormData();
    formData.append("file", modelFile);
    previews.forEach(p => formData.append("previews", p));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setUploading(false); return; }
      setUploadResult(data);
      toast.success("Files uploaded successfully");
      setStep(2);
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!form.copyrightConfirmed) {
      toast.error("You must confirm copyright ownership");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          ...uploadResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success("Model submitted for review!");
      router.push("/dashboard/designer");
    } catch {
      toast.error("Failed to create listing");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Upload New Model</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {["Upload File", "Details", "Review"].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${i + 1 <= step ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i + 1 <= step ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100'}`}>{i + 1}</div>
            <span className="text-sm font-medium hidden sm:block">{s}</span>
            {i < 2 && <div className={`w-8 h-0.5 ${i + 1 < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors">
              <input type="file" accept=".3dm" onChange={handleFileSelect} className="hidden" id="model-upload" />
              <label htmlFor="model-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-700">{modelFile ? modelFile.name : "Click to upload .3dm file"}</p>
                <p className="text-sm text-gray-500 mt-1">Max 500MB</p>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview Images (up to 10)</label>
              <input type="file" accept="image/*" multiple onChange={handlePreviewSelect} className="hidden" id="preview-upload" />
              <label htmlFor="preview-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Upload className="h-4 w-4" /> Add Images
              </label>
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {previews.map((p, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setPreviews(prev => prev.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleUpload} loading={uploading} disabled={!modelFile}>
                {uploading ? "Uploading..." : "Upload & Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-8 space-y-5">
            <Input id="title" label="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Modern Lounge Chair" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe your model in detail..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="price" label="Price (USD) *" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="19.99" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                <select value={form.licenseType} onChange={e => setForm({...form, licenseType: e.target.value})} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="PERSONAL">Personal License</option>
                  <option value="COMMERCIAL">Commercial License</option>
                  <option value="EXCLUSIVE">Exclusive License</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="polyCount" label="Polygon Count" type="number" value={form.polyCount} onChange={e => setForm({...form, polyCount: e.target.value})} placeholder="50000" />
              <Input id="rhinoVersion" label="Rhino Version" value={form.rhinocerosVersion} onChange={e => setForm({...form, rhinocerosVersion: e.target.value})} placeholder="8" />
            </div>
            <Input id="tags" label="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="furniture, chair, modern, interior" />

            {/* Copyright Confirmation */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-amber-800">Copyright Ownership Confirmation</p>
                  <p className="text-sm text-amber-700 mt-1">
                    By submitting this model, you confirm that you are the original creator and own all rights to this 3D model.
                    Uploading copyrighted material without permission may result in account termination.
                  </p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={form.copyrightConfirmed} onChange={e => setForm({...form, copyrightConfirmed: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-amber-800 font-medium">I confirm I own the copyright to this model</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!form.copyrightConfirmed}>Review & Submit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-8 space-y-4">
            <h2 className="text-lg font-semibold">Review Your Model</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Title:</span><span className="font-medium">{form.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price:</span><span className="font-medium">${form.price}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">License:</span><span className="font-medium">{form.licenseType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">File:</span><span className="font-medium">{modelFile?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="font-medium text-amber-600">Pending Review</span></div>
            </div>
            <p className="text-xs text-gray-500">Your model will be reviewed by our team before being published. This usually takes 24-48 hours.</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} loading={submitting}>Submit for Review</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
