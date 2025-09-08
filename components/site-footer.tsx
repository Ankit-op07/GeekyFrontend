import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Main content */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="font-bold text-lg mb-2">Geeky Frontend</div>
            <p className="text-xs text-muted-foreground">
              Interview prep for frontend engineers
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Quick Links</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
              <li><a href="#features" className="hover:text-primary">Features</a></li>
              <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms and Conditions</Link></li>
              <li><Link href="/refund" className="hover:text-primary">Refund and Cancellation</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Geeky Frontend. All rights reserved.</p>
          <p className="mt-1">100% Genuine Content • Created with ❤️</p>
        </div>
      </div>
    </footer>
  )
}