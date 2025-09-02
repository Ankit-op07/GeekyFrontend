export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          {/* <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">Geeky Frontend</span>
          </div> */}
          <p className="mt-2 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Geeky Frontend. All rights reserved.
          </p>
        </div>
        <nav className="text-sm text-muted-foreground flex items-center gap-4">
          <a href="#pricing" className="hover:text-primary">
            Pricing
          </a>
          <a href="#inside" className="hover:text-primary">
            What’s inside
          </a>
          <a href="#faq" className="hover:text-primary">
            FAQ
          </a>
          <a
            href="https://www.instagram.com/geeky_frontend/"
            target="_blank"
            aria-label="Contact via email"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
