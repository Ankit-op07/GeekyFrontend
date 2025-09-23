import { SiteHeader } from "@/components/site-header"
import { NotificationBanner } from "@/components/notification-banner"
import { Hero } from "@/components/hero"
import { Inside } from "@/components/inside"
import { SiteFooter } from "@/components/site-footer"
import { Features } from "@/components/features"
import { Curriculum } from "@/components/curriculum"
import { FAQ } from "@/components/faq"
import { Pricing } from "@/components/pricing"
import { ContentPreview } from "@/components/content-preview"
import { AIChatbot } from "@/components/ai-chatbot";
import { ProductsShowcase } from "@/components/product-showcase"
import { ImageProductsShowcase } from "@/components/image-product-showcase"

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      {/* <NotificationBanner /> */}
      <Hero />
      <ProductsShowcase />
      {/* <ImageProductsShowcase/> */}
      
      {/* <Inside /> */}
      <Features />
      <Curriculum />
      {/* <ContentPreview /> */}
      <Pricing />
      <FAQ />
      <SiteFooter />
           {/* Add the AI chatbot */}
      {/* <AIChatbot /> */}


      {/* Floating Contact Us */}
      {/* <aside className="fixed bottom-4 right-4 z-50">
        <a
          href="https://www.instagram.com/geeky_frontend/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Contact Us via Instagram"
        >
          Chat
        </a>
      </aside> */}
    </main>
  )
}