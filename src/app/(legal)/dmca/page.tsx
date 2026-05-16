"use client";

export default function DMCAPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">DMCA Notice & Takedown Policy</h1>
      <div className="text-gray-600 text-sm leading-relaxed space-y-4">
        <p>Last updated: January 2026</p>

        <p>3DM Store respects intellectual property rights and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond promptly to notices of alleged copyright infringement.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Filing a DMCA Notice</h2>
        <p>If you believe your copyrighted work has been infringed, please provide the following information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Identification of the copyrighted work claimed to have been infringed</li>
          <li>Identification of the material that is claimed to be infringing</li>
          <li>Your contact information (name, address, phone number, email)</li>
          <li>A statement that you have a good faith belief that use is not authorized</li>
          <li>A statement that the information is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
          <li>Your physical or electronic signature</li>
        </ul>

        <p className="mt-4">Send DMCA notices to: dmca@3dmstore.com</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Counter-Notice</h2>
        <p>If you believe your content was removed in error, you may submit a counter-notice with the following:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Identification of the material removed and its location before removal</li>
          <li>A statement under penalty of perjury that you have a good faith belief the material was removed as a result of mistake or misidentification</li>
          <li>Your name, address, phone number, and email</li>
          <li>A statement consenting to jurisdiction of the federal court in your district</li>
          <li>Your physical or electronic signature</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">Repeat Infringers</h2>
        <p>Accounts that receive multiple DMCA notices will be terminated.</p>
      </div>
    </div>
  );
}
