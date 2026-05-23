import Link from "next/link";

export const metadata = { title: "License Types" };

export default function LicensesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">License Types</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <div className="prose prose-gray max-w-none text-gray-700 text-sm leading-relaxed space-y-8">

        <section>
          <p>Every model on 3DM Store is sold under one of three license types. The license governs what you can and cannot do with the file after purchase. All licenses grant you the right to use the model, but the scope of that use depends on the license you choose.</p>
        </section>

        {/* Personal License */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personal License</h2>
              <p className="text-sm text-gray-500 mt-0.5">Best for hobbyists and personal projects</p>
            </div>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Included by default</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-2">✅ Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>Use in personal/non-commercial projects</li>
                <li>Modify and adapt the model</li>
                <li>Use in student work and portfolios</li>
                <li>Render images for personal display</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">❌ Not Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>Resell or redistribute the file</li>
                <li>Use in commercial products or services</li>
                <li>Sublicense or transfer the file</li>
                <li>Share the file with others</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Commercial License */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Commercial License</h2>
              <p className="text-sm text-gray-500 mt-0.5">For professionals and businesses</p>
            </div>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Higher price</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-2">✅ Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>All Personal License permissions</li>
                <li>Use in commercial products and services</li>
                <li>Incorporate into client projects</li>
                <li>Use in advertising and marketing materials</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">❌ Not Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>Resell the original file</li>
                <li>Redistribute as a standalone model</li>
                <li>Transfer or sublicense the file</li>
                <li>Share the file with non-clients</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Exclusive License */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exclusive License</h2>
              <p className="text-sm text-gray-500 mt-0.5">Full ownership transfer — designer removes the model from the marketplace</p>
            </div>
            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Negotiated price</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-2">✅ Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>All Commercial License permissions</li>
                <li>Full ownership of the model design</li>
                <li>Model is removed from marketplace</li>
                <li>Designer cannot sell the model to anyone else</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">❌ Not Allowed</h3>
              <ul className="space-y-1.5 text-sm">
                <li>Resell the original file as a standalone model</li>
                <li>Claim the design as your own original creation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 rounded-xl p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">License Violations</h2>
          <p className="text-sm text-gray-600">Violating a license agreement is a breach of our Terms of Service and may constitute copyright infringement. If you believe a buyer has misused your model, please report it using the <strong>"Report this Model"</strong> button on the product page or contact us at <a href="mailto:support@3dmstore.com" className="text-gray-600 underline">support@3dmstore.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Questions?</h2>
          <p className="text-sm text-gray-600">If you&apos;re unsure which license you need, contact the designer directly or reach out to us at <a href="mailto:support@3dmstore.com" className="text-gray-600 underline">support@3dmstore.com</a>.</p>
        </section>

      </div>

      <div className="mt-8 pt-6 border-t">
        <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 underline">Terms of Service</Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/designer-agreement" className="text-sm text-gray-600 hover:text-gray-900 underline">Designer Agreement</Link>
      </div>
    </div>
  );
}
