import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function SiteHeader() {
  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/inter.png"}
            alt="Illustration of frontend interview preparation materials"
            priority
            height={130}
            width={130}
            className="hidden md:block"
          />
          <Image
            src={"/inter-mobile.jpg"}
            alt="Illustration of frontend interview preparation materials"
            priority
            height={50}
            width={50}
            className="md:hidden"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#pricing" className="text-muted-foreground hover:text-primary">
            Pricing
          </a>
          <a href="#inside" className="text-muted-foreground hover:text-primary">
            What’s inside
          </a>
          {/* <a href="#preview" className="text-muted-foreground hover:text-primary">
            Preview
          </a> */}
          <a href="#faq" className="text-muted-foreground hover:text-primary">
            FAQ
          </a>
          <a
            href="https://www.instagram.com/geeky_frontend/"
            target="_blank"
            className="text-muted-foreground hover:text-primary"
            aria-label="Contact via email"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#pricing">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Explore Plans</Button>
          </a>
          <a
            href="https://www.instagram.com/geeky_frontend/"
            target="_blank"
          >
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent">
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
