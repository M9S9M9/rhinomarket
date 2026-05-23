import Link from "next/link";

export const metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">What Are Cookies</h2>
          <p>Cookies are small text files stored on your device by your web browser. They help websites function properly and improve your experience.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Purpose</th>
                  <th className="text-left p-2 border">Duration</th>
                  <th className="text-left p-2 border">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-mono text-xs">authjs.session-token</td>
                  <td className="p-2 border">Session authentication — keeps you logged in</td>
                  <td className="p-2 border">Session / 8h</td>
                  <td className="p-2 border">Essential</td>
                </tr>
                <tr>
                  <td className="p-2 border font-mono text-xs">next-auth.session-token</td>
                  <td className="p-2 border">Legacy session authentication</td>
                  <td className="p-2 border">Session / 8h</td>
                  <td className="p-2 border">Essential</td>
                </tr>
                <tr>
                  <td className="p-2 border font-mono text-xs">__Secure-* variants</td>
                  <td className="p-2 border">Secure session cookies over HTTPS</td>
                  <td className="p-2 border">Session / 8h</td>
                  <td className="p-2 border">Essential</td>
                </tr>
                <tr>
                  <td className="p-2 border font-mono text-xs">cookie-consent</td>
                  <td className="p-2 border">Stores your cookie preference</td>
                  <td className="p-2 border">Persistent</td>
                  <td className="p-2 border">Essential</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Third-Party Cookies</h2>
          <p>We use Stripe for payment processing. Stripe may set its own cookies during checkout. These are controlled by Stripe's privacy policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies may prevent you from signing into your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Updates</h2>
          <p>We may update this Cookie Policy from time to time. Changes will be posted on this page.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p>If you have questions about our cookie usage, contact us at <a href="mailto:privacy@3dmstore.com" className="text-gray-600 underline">privacy@3dmstore.com</a>.</p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t">
        <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 underline">Privacy Policy</Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 underline">Terms of Service</Link>
      </div>
    </div>
  );
}
