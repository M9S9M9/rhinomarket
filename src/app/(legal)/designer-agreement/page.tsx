"use client";

export default function DesignerAgreementPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Designer Agreement</h1>
      <div className="text-gray-600 text-sm leading-relaxed space-y-4">
        <p>Last updated: January 2026</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Designer Status</h2>
        <p>Designers are independent creators, not employees or contractors of 3DM Store. You retain full ownership of your intellectual property.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. License Grant to Platform</h2>
        <p>By uploading a model, you grant 3DM Store a limited license to host, display, and distribute your model through the marketplace. You retain all other rights.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Pricing and Commissions</h2>
        <p>You set your own prices. The platform deducts a commission of {process.env.PLATFORM_COMMISSION_PERCENT || "15"}% from each sale. Commissions are non-negotiable.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Payment Terms</h2>
        <p>Payouts are processed through Stripe Connect. Funds become available for withdrawal after a holding period. Minimum payout amounts may apply.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Content Standards</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All models must be original works</li>
          <li>Models must be in .3dm format compatible with Rhino 3D</li>
          <li>Descriptions and tags must be accurate</li>
          <li>Preview images must accurately represent the model</li>
          <li>No illegal, offensive, or prohibited content</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Model Approval</h2>
        <p>All models are subject to review before publication. 3DM Store reserves the right to reject or remove models that violate our standards.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Account Termination</h2>
        <p>Violation of this agreement may result in account suspension, removal of listings, and forfeiture of pending earnings in cases of fraud.</p>
      </div>
    </div>
  );
}
