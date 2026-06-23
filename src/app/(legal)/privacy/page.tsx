"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="text-gray-600 text-sm leading-relaxed space-y-4">
        <p>Last updated: January 2026</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Information We Collect</h2>
        <p>We collect information you provide when creating an account, including your name, email address, and profile information. We also collect transaction data and usage analytics.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide and improve the marketplace service</li>
          <li>To process transactions and send receipts</li>
          <li>To communicate with you about your account and the platform</li>
          <li>To detect and prevent fraud</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Data Sharing</h2>
        <p>We accept payments in USDT (TRC20). Payment transactions are verified manually. We do not sell your personal data to third parties.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Data Security</h2>
        <p>We implement industry-standard security measures including encryption at rest and in transit, regular security audits, and access controls.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. You can delete your account directly from your <a href="/dashboard/profile" className="text-gray-600 underline">Profile Settings</a> page, or contact us at privacy@3dmstore.com for data requests.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Cookies</h2>
        <p>We use essential cookies for authentication and security. You can manage your cookie preferences via our <a href="/cookie-policy" className="text-gray-600 underline">Cookie Policy</a> page, where a consent banner is displayed on your first visit.</p>
      </div>
    </div>
  );
}
