"use client"
import { useState } from "react"

const faqData = [
  {
    question: "Do I get future updates?",
    answer: "Yes! All updates are free for lifetime. When we add new content or revise existing materials, you'll get access automatically.",
    icon: "🔄"
  },
  {
    question: "How do I access the content?",
    answer: "You'll receive an email with Google drive link and access instantly after the payment completion. Check your spam folder if you don't see it.",
    icon: "📥"
  },
  {
    question: "Is this beginner friendly?",
    answer: "Absolutely! Start with JS Kit for basics, then move to Complete Kit as you progress.",
    icon: "👶"
  },
  {
    question: "Is JS Kit included in Complete Kit?",
    answer: "Yes! Complete Kit includes everything from JS Kit plus React, DSA, Machine Coding, and more.",
    icon: "📦"
  },
  {
    question: "How long to complete?",
    answer: "Most finish in 4-8 weeks (2-3 hours daily). You have lifetime access to learn at your pace.",
    icon: "⏰"
  },
  {
    question: "Is the content genuine?",
    answer: "100% genuine, curated from real interviews. Created by engineers who've successfully cracked these interviews.",
    icon: "✅"
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="border-t">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary mb-3">
            FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Common Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know
          </p>
        </div>

        <div className="space-y-2">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className={`rounded-lg border transition-all ${
                openIndex === index ? 'bg-secondary/5' : 'bg-card'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{faq.icon}</span>
                  <h3 className="font-medium text-sm sm:text-base">{faq.question}</h3>
                </div>
                <svg 
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <div className="px-4 pb-3">
                  <p className="text-xs sm:text-sm text-muted-foreground pl-9">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        {/* <div className="mt-8 text-center p-6 bg-secondary/10 rounded-lg">
          <h3 className="text-base font-semibold mb-2">Still have questions?</h3>
          <a
            href="https://www.instagram.com/geeky_frontend/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
            </svg>
            Contact on Instagram
          </a>
        </div> */}
      </div>
    </section>
  )
}