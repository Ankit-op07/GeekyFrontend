export function FAQ() {
  return (
    <section id="faq" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
          FAQ
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Common Questions</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Do I get future updates?</h3>
            <p className="mt-2 text-foreground/80">
              Yes. When we revise or add content, we’ll provide updated PDFs or outlines, so you always have the latest
              version.
            </p>
          </div>
          {/* <div>
            <h3 className="font-semibold">Is there a refund policy?</h3>
            <p className="mt-2 text-foreground/80">
              If the kit doesn’t match the description, contact us within 7 days and we’ll review your case.
            </p>
          </div> */}
          <div>
            <h3 className="font-semibold">How do I access the content?</h3>
            <p className="mt-2 text-foreground/80">
              You’ll get a download link to the PDFs and resources after purchase. Keep them for personal use.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is this beginner friendly?</h3>
            <p className="mt-2 text-foreground/80">
              Yes—start with the JS Kit. The Complete Kit is ideal after you’re comfortable with JS fundamentals.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
