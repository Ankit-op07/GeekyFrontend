import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { SiteFooter } from "@/components/site-footer"
import { Features } from "@/components/features"
import { Curriculum } from "@/components/curriculum"
import { FAQ } from "@/components/faq"
import { ProductsShowcase } from "@/components/product-showcase"
import { MembershipShowcase } from "@/components/membership-showcase"

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      <Hero />
      {/* Membership sits ABOVE the kit grid on purpose: it is the better answer
          than buying kits one at a time, and that argument has to land before a
          visitor starts comparing individual kit prices. */}
      <MembershipShowcase />
      <ProductsShowcase />
      <Features />
      <Curriculum />
      <FAQ />
      <SiteFooter />
    </main>
  )
}