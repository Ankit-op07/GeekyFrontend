// app/privacy/page.tsx
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      
      <div className="mx-auto max-w-4xl px-4 py-24 md:py-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Geeky Frontend, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
              and purchase our products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Name (optional)</li>
                  <li>Email address</li>
                  <li>Payment information (processed securely via Razorpay)</li>
                </ul>
              </div>
              
              {/* <div>
                <h3 className="text-lg font-semibold mb-2">Automatically Collected Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Pages visited on our website</li>
                  <li>Time and date of visits</li>
                  <li>Referring website addresses</li>
                </ul>
              </div> */}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process and fulfill your orders</li>
              <li>Send you product access links and instructions</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send important updates about your purchases</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraudulent transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payment transactions are processed through Razorpay, a secure third-party payment gateway. 
              We do not store or have access to your credit card details, bank account information, or other sensitive payment data. 
              Razorpay's privacy policy governs the collection and use of your payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>With Razorpay for payment processing</li>
              <li>With email service providers for sending course materials</li>
              <li>When required by law or to respond to legal processes</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your browsing experience and analyze website traffic. 
              You can control cookie preferences through your browser settings. Disabling cookies may limit certain features 
              of our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites (such as Google Drive for content delivery). 
              We are not responsible for the privacy practices of these external sites. We encourage you to review 
              their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access: Request a copy of your personal data</li>
              <li>Correction: Request corrections to inaccurate information</li>
              <li>Deletion: Request deletion of your personal data (subject to legal requirements)</li>
              <li>Opt-out: Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, please contact us at support@geekyfrontend.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal 
              information from children. If you believe we have collected information from a minor, please contact us 
              immediately for removal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
              Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Purchase records 
              are maintained for accounting and tax purposes as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by updating the "Last updated" date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Email: support@geekyfrontend.com</p>
              <p>Instagram: @geeky_frontend</p>
              <p>Location: Jaipur, Rajasthan, India</p>
            </div>
          </section>
        </div>

        {/* Navigation Links */}
        {/* <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
            <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>
            <Link href="/contact" className="text-primary hover:underline">Contact Us</Link>
            <Link href="/" className="text-primary hover:underline">Back to Home</Link>
          </div>
        </div> */}
      </div>

      <SiteFooter />
    </main>
  )
}