import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { SiteFooter } from "@/components/site-footer"
import { Features } from "@/components/features"
import { Curriculum } from "@/components/curriculum"
import { FAQ } from "@/components/faq"
import { ProductsShowcase } from "@/components/product-showcase"

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      <Hero />
      <ProductsShowcase />
      <Features />
      <Curriculum />
      <FAQ />
      <SiteFooter />
    </main>
  )
}