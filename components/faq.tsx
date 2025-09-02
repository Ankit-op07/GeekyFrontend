const faqData = [
  {
    question: "Do I get future updates?",
    answer: "Yes. When we revise or add content, we'll provide updated PDFs or outlines, so you always have the latest version."
  },
  {
    question: "How do I access the content?",
    answer: "You'll get a download link to the PDFs and resources after purchase. Keep them for personal use."
  },
  {
    question: "Is this beginner friendly?",
    answer: "Yes—start with the JS Kit. The Complete Kit is ideal after you're comfortable with JS fundamentals."
  },
  // Uncomment if you want to add this back later
  {
    question: "Is JS Interview Preparation Kit also included in Complete Frontend Interview Preparation Kit?",
    answer: "Yes, the Complete Frontend Interview Preparation Kit includes everything from the JS Interview Preparation Kit along with additional resources."
  }
]

export function FAQ() {
  return (
    <section id="faq" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
          FAQ
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Common Questions</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {faqData.map((faq, index) => (
            <div key={index}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-foreground/80">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}