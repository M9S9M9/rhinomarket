import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <img src="/logo-white.svg" alt="3DM Store" className="h-10 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed">
              The premier marketplace for Rhino 3D files. Buy and sell premium .3dm models with confidence.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Marketplace</h3>
            <ul className="space-y-2">
              <li><Link href="/marketplace" className="text-sm hover:text-white transition-colors">Browse All</Link></li>
              <li><Link href="/marketplace?sort=popular" className="text-sm hover:text-white transition-colors">Popular Models</Link></li>
              <li><Link href="/categories" className="text-sm hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/marketplace?license=commercial" className="text-sm hover:text-white transition-colors">Commercial License</Link></li>
              <li><Link href="/licenses" className="text-sm hover:text-white transition-colors">License Types</Link></li>
            </ul>
          </div>

          {/* For Designers */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">For Designers</h3>
            <ul className="space-y-2">
              <li><Link href="/auth/register" className="text-sm hover:text-white transition-colors">Start Selling</Link></li>
              <li><Link href="/dashboard/designer" className="text-sm hover:text-white transition-colors">Designer Dashboard</Link></li>
              <li><Link href="/designer-agreement" className="text-sm hover:text-white transition-colors">Designer Agreement</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-sm hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-sm hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/dmca" className="text-sm hover:text-white transition-colors">DMCA Notice</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} 3DM Store. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500">Built for Rhino 3D Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
