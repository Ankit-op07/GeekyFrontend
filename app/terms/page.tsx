// app/terms/page.tsx
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      
      <div className="mx-auto max-w-4xl px-4 py-24 md:py-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Geeky Frontend ("the Website"), you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you must not use our website or purchase our products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Products and Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Geeky Frontend provides digital educational content including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>JavaScript Interview Preparation Kit</li>
              <li>Complete Frontend Interview Preparation Kit</li>
              <li>Frontend Interview Experiences Kit</li>
              <li>Related educational materials and resources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Digital Product Delivery</h2>
            <p className="text-muted-foreground leading-relaxed">
              All products are delivered digitally via email within 5-10 minutes of successful payment. 
              Download links and access instructions will be sent to the email address provided during purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All prices are listed in Indian Rupees (₹)</li>
              <li>Payment is processed securely through Razorpay</li>
              <li>We accept UPI, Credit/Debit Cards, Net Banking, and Wallets</li>
              <li>Full payment is required before access to materials is granted</li>
            </ul>
          </section>

          <section className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-red-600">5. No Refund Policy</h2>
            <p className="text-red-600 font-semibold mb-3">
              IMPORTANT: All sales are final. We do not offer refunds under any circumstances.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Due to the digital nature of our products and immediate access upon purchase, we maintain a strict no-refund policy. 
              By purchasing our products, you acknowledge and agree that all sales are final and non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All content, materials, and products available on Geeky Frontend are protected by intellectual property laws. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use purchased materials for personal learning only</li>
              <li>Not share, redistribute, or resell any content</li>
              <li>Not copy or reproduce materials for commercial purposes</li>
              <li>Respect all copyright and proprietary notices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Providing accurate information during purchase</li>
              <li>Maintaining the confidentiality of your access credentials</li>
              <li>Ensuring your email address is valid for product delivery</li>
              <li>Downloading and backing up purchased materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Geeky Frontend shall not be liable for any indirect, incidental, special, or consequential damages 
              arising from the use or inability to use our products. Our total liability shall not exceed the 
              amount paid for the specific product in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our educational materials are provided "as is" without warranties of any kind. While we strive for accuracy, 
              we do not guarantee specific outcomes, job placements, or interview success. Individual results may vary 
              based on personal effort and circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of our website after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes shall be subject to the exclusive jurisdiction of the courts in Rajasthan, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Email: support@geekyfrontend.com</p>
              <p>Instagram: @geeky_frontend</p>
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}