// app/refund/page.tsx
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { AlertCircle, XCircle } from "lucide-react"

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      
      <div className="mx-auto max-w-4xl px-4 py-24 md:py-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Refund and Cancellation Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-2">NO REFUND POLICY</h2>
              <p className="text-red-600 font-semibold mb-2">
                All sales are final. We do not offer refunds or cancellations under any circumstances.
              </p>
              <p className="text-muted-foreground">
                Please read this policy carefully before making a purchase. By purchasing our products, 
                you acknowledge and agree that all sales are final and non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Nature of Digital Products</h2>
            <p className="text-muted-foreground leading-relaxed">
              Geeky Frontend provides digital educational materials that are delivered instantly upon purchase. 
              Due to the nature of digital content:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Products are delivered immediately via email after payment</li>
              <li>Content can be accessed, downloaded, and used instantly</li>
              <li>Digital products cannot be "returned" once delivered</li>
              <li>The value of the product is in the information it contains</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Why We Don't Offer Refunds</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">📚</span> Instant Access
                </h3>
                <p className="text-muted-foreground">
                  Once payment is confirmed, you receive immediate access to all course materials. 
                  The knowledge and content cannot be "unlearned" or returned.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">🔒</span> Intellectual Property Protection
                </h3>
                <p className="text-muted-foreground">
                  Our materials contain proprietary content and strategies. The no-refund policy helps 
                  protect our intellectual property from unauthorized distribution.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">💰</span> Fair Pricing
                </h3>
                <p className="text-muted-foreground">
                  We offer our products at highly competitive prices with significant discounts. 
                  Our pricing reflects the no-refund policy.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Before You Purchase</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To help you make an informed decision:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Review the detailed product descriptions on our website</li>
              <li>Check the curriculum and topics covered</li>
              <li>Read the FAQ section for common questions</li>
              <li>View sample content available on our product pages</li>
              <li>Contact us at support@geekyfrontend.com if you have questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Cancellation Policy</h2>
            <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground">
                    <span className="font-semibold">Order cancellations are not possible</span> once payment 
                    is processed. The digital products are delivered automatically and instantly upon successful payment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Exceptional Circumstances</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              While we maintain a strict no-refund policy, we may consider exceptions ONLY in the following rare cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Duplicate purchase (same product purchased twice by mistake)</li>
              <li>Technical error preventing access to purchased content despite multiple attempts to resolve</li>
              <li>Payment charged but order not processed due to system error</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Such cases will be evaluated individually and require proof of the issue. Contact support@geekyfrontend.com 
              with transaction details if you believe your case qualifies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Product Quality Commitment</h2>
            <p className="text-muted-foreground leading-relaxed">
              While we don't offer refunds, we are committed to providing high-quality educational materials:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>All content is regularly updated to remain relevant</li>
              <li>Materials are created by experienced professionals</li>
              <li>We provide email support for any content-related queries</li>
              <li>Lifetime access ensures you can revisit materials anytime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Payment Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you initiate a chargeback or payment dispute without attempting to resolve the issue with us first:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Your access to purchased materials may be revoked</li>
              <li>You may be banned from future purchases</li>
              <li>We reserve the right to take legal action for fraudulent chargebacks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Acknowledgment</h2>
            <p className="text-muted-foreground leading-relaxed">
              By making a purchase on Geeky Frontend, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>You have read and understood this refund and cancellation policy</li>
              <li>You agree that all sales are final</li>
              <li>You waive any rights to refunds or cancellations</li>
              <li>You are making an informed purchase decision</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this policy or technical issues with accessing your purchased content:
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Email: support@geekyfrontend.com</p>
              <p>Instagram: @geeky_frontend</p>
              <p>Response Time: Within 24 hours</p>
            </div>
          </section>
        </div>

        {/* Final Notice */}
        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <p className="text-center font-semibold">
            Please ensure you understand and agree with this policy before making a purchase.
          </p>
          <p className="text-center text-muted-foreground mt-2">
            If you have any doubts, contact us before purchasing.
          </p>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}