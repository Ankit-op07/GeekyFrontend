"use client"
import { useState } from "react"

export function ContentPreview() {
  const [activePreview, setActivePreview] = useState(0)
  
  const previews = [
    {
      title: "JS Interview Kit",
      icon: "📚",
      samples: [
        "✓ Closure questions with detailed explanations",
        "✓ Event loop & async JavaScript patterns",
        "✓ Prototype chain deep dive",
        "✓ Company-specific question banks",
        "✓ Quick revision cheatsheets"
      ],
      link: "https://drive.google.com/file/d/11t2PZoGjKk7dcOchtIEYizLV51DDbuDH/view?usp=sharing"
    },
    {
      title: "Complete Frontend Kit",
      icon: "🚀",
      samples: [
        "✓ Everything from JS Kit included",
        "✓ React hooks & patterns guide",
        "✓ System design for frontend",
        "✓ DSA problems in JavaScript",
        "✓ Machine coding examples",
        "✓ Cold email templates"
      ],
      link: "https://docs.google.com/document/d/1PaZqenxA8LFhBiHVIm84A3pZBCdEDxZxzSC6bauPCLc/edit?usp=sharing"
    },
    {
      title: "Interview Experiences",
      icon: "💼",
      samples: [
        "✓ 30+ real interview experiences",
        "✓ Round-by-round breakdowns",
        "✓ Questions actually asked",
        "✓ Do's and don'ts for each round",
        "✓ Salary negotiation insights"
      ],
      link: "https://drive.google.com/file/d/1Lrkv2ZewJ02YTp4meqcEXFZ92z2DTgE-/view?usp=sharing"
    }
  ]

  return (
    <section className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Available
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            See Before You Buy
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Check out sample content from each kit
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Tab navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {previews.map((preview, index) => (
              <button
                key={index}
                onClick={() => setActivePreview(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activePreview === index 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-card border hover:bg-accent'
                }`}
              >
                <span>{preview.icon}</span>
                <span>{preview.title}</span>
              </button>
            ))}
          </div>

          {/* Preview content */}
          <div className="bg-card rounded-xl border shadow-lg p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">{previews[activePreview].icon}</span>
                {previews[activePreview].title} - Sample Content
              </h3>
              
              <div className="space-y-3">
                {previews[activePreview].samples.map((sample, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <span className="text-sm sm:text-base text-muted-foreground">
                      {sample}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <a
                href={previews[activePreview].link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Full Sample PDF
              </a>
              <a
                href="#pricing"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium hover:bg-accent transition-all"
              >
                Get Complete Access
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Trust note */}
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
            📌 Full kits contain 10x more content than these samples
          </p>
        </div>
      </div>
    </section>
  )
}