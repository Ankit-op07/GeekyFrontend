import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Inside } from "@/components/inside"
import { SiteFooter } from "@/components/site-footer"
import { Features } from "@/components/features"
import { Curriculum } from "@/components/curriculum"
import { FAQ } from "@/components/faq"
import { Pricing } from "@/components/pricing"
import { ContentPreview } from "@/components/content-preview"

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      <Hero />
      <Inside />
      <Features />
      <Curriculum />
      <ContentPreview />
      <Pricing />
      
      <FAQ />
      <SiteFooter />

      {/* Floating Contact Us */}
      <aside className="fixed bottom-4 right-4 z-50">
        <a
            href="https://www.instagram.com/geeky_frontend/"
            target="_blank"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Contact Us via email"
        >
          Contact Us
        </a>
      </aside>
    </main>
  )
}
