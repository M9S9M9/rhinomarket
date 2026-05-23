import Link from "next/link";

export const metadata = { title: "Warranty Disclaimer" };

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Warranty Disclaimer</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <div className="prose prose-gray max-w-none text-gray-700 text-sm leading-relaxed space-y-6">

        <section>
          <h2 className="text-lg font-semibold text-gray-900">No Warranties</h2>
          <p>All models, files, and content on 3DM Store are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without any warranties of any kind, either express or implied, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Implied warranties of merchantability or fitness for a particular purpose</li>
            <li>Warranties that the files will be error-free, uninterrupted, or secure</li>
            <li>Warranties regarding the accuracy, completeness, or reliability of any model</li>
            <li>Warranties that the files are compatible with any specific software version or hardware</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Third-Party Content</h2>
          <p>3DM Store is a marketplace platform and does not create, review, or verify the models listed by designers. We disclaim all liability for the quality, safety, or legality of third-party models. Designers are solely responsible for their uploaded content.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">No Guarantee of Results</h2>
          <p>We do not guarantee that models will meet your specific requirements, produce expected results, or be suitable for any particular application. Buyers should review model descriptions, previews, and designer ratings before purchasing.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">File Integrity</h2>
          <p>While we implement security measures including file hash verification and malware scanning, we do not warrant that downloaded files are free from viruses, corruption, or other harmful components. Buyers are responsible for scanning files with their own security tools.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, 3DM Store shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or any files purchased through it, including but not limited to loss of profits, data, or business opportunities.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Jurisdiction</h2>
          <p>Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability. In such cases, our liability shall be limited to the fullest extent permitted by applicable law.</p>
        </section>

      </div>

      <div className="mt-8 pt-6 border-t">
        <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 underline">Terms of Service</Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/licenses" className="text-sm text-gray-600 hover:text-gray-900 underline">License Types</Link>
      </div>
    </div>
  );
}
