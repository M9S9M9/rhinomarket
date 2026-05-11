"use client";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: January 2026</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
        <p>By accessing or using RhinoMarket ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Platform Description</h2>
        <p>RhinoMarket is a marketplace connecting buyers and sellers of Rhino 3D (.3dm) files. We provide the platform infrastructure but are not a party to the transaction between buyers and designers.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use the Platform.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Designer Obligations</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You confirm that you own all rights to the models you upload</li>
          <li>Models must be original works and not infringe any third-party rights</li>
          <li>You agree to provide accurate descriptions and appropriate categorization</li>
          <li>You may not upload content that is illegal, offensive, or violates any laws</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Buyer Obligations</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You agree to use purchased models according to the specified license terms</li>
          <li>You may not redistribute, resell, or share purchased files</li>
          <li>You agree not to attempt to circumvent the platform's payment system</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Commission and Fees</h2>
        <p>The Platform charges a commission of {process.env.PLATFORM_COMMISSION_PERCENT || "15"}% on each transaction. This commission is deducted before the designer receives payment.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Refund Policy</h2>
        <p>Refunds are handled on a case-by-case basis. If a file is corrupted or significantly different from its description, the buyer may request a refund within 14 days of purchase.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Limitation of Liability</h2>
        <p>RhinoMarket is not liable for any damages arising from the use of the Platform or from files purchased through the Platform. All files are provided "as is."</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Termination</h2>
        <p>We reserve the right to terminate accounts that violate these terms or engage in fraudulent activity.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">10. Changes to Terms</h2>
        <p>We may modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
      </div>
    </div>
  );
}
