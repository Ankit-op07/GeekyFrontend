import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Mail, Phone, MapPin, Clock, MessageCircle, Instagram, Send } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about our interview prep kits? We're here to help you succeed in your frontend journey.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Let's Connect</h2>
            <p className="text-muted-foreground mb-8">
              We typically respond within 2-4 hours during business hours. For urgent queries, 
              WhatsApp is the fastest way to reach us.
            </p>

            {/* Contact Methods */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a href="mailto:support@geekyfrontend.com" className="text-muted-foreground hover:text-primary">
                    support@geekyfrontend.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best for: General inquiries, feedback
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <a 
                    href="https://wa.me/919166011247" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    +91 9166011247
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best for: Quick support, payment issues
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Instagram className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instagram</h3>
                  <a 
                    href="https://www.instagram.com/geeky_frontend/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    @geeky_frontend
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best for: Updates, success stories, tips
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-muted-foreground">
                    Jaipur, Rajasthan, India
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Serving students globally
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Business Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Saturday: 10:00 AM - 8:00 PM IST
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sunday: 12:00 PM - 6:00 PM IST
                  </p>
                </div>
              </div>
            </div>

            {/* Company Details for Razorpay */}
            <div className="mt-8 p-6 bg-muted/20 rounded-lg">
              <h3 className="font-semibold mb-3">Business Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium">Business Name:</span> Geeky Frontend</p>
                <p><span className="font-medium">Type:</span> Educational Services</p>
                <p><span className="font-medium">Founded:</span> 2025</p>
                <p><span className="font-medium">GST:</span> Not Applicable (Under threshold)</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          {/* <div className="bg-card rounded-xl border p-8">
            <h2 className="text-xl font-bold mb-6">Send us a Message</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <select 
                  id="subject"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>General Inquiry</option>
                  <option>Payment Issue</option>
                  <option>Content Access</option>
                  <option>Technical Support</option>
                  <option>Feedback</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              By submitting this form, you agree to our Privacy Policy
            </p>
          </div> */}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">How do I access my purchased materials?</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive an email with download links within 5 minutes of payment. 
                Check your spam folder if you don't see it.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major payment methods through Razorpay including UPI, 
                Credit/Debit Cards, Net Banking, and Wallets.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                Due to the digital nature of our products, we don't offer refunds. 
                However, we provide sample content to preview before purchase.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">Can I share my account with others?</h3>
              <p className="text-sm text-muted-foreground">
                Each purchase is for individual use only. Sharing accounts or materials 
                violates our terms of service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Response Time */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team typically responds within 2-4 hours during business hours
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/919166011247" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <a 
              href="mailto:support@geekyfrontend.com" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium hover:bg-accent"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}