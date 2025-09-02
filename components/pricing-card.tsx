import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PurchaseDialog } from "./purchase-dialog"

type PricingCardProps = {
  name: string
  description: string
  priceINR: number
  features: string[]
  popular?: boolean
  cta?: string
}

export function PricingCard({
  name,
  description,
  priceINR,
  features,
  popular,
  cta = "Get this plan",
}: PricingCardProps) {
  return (
    <Card className={`flex flex-col h-full ${popular ? "border-primary" : ""}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          {popular && (
            <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">Best</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="mt-2">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-foreground">₹{priceINR}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>

        <ul className="mt-4 grid gap-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto">
        <PurchaseDialog
          planName={name}
          priceINR={priceINR}
          triggerClassName={`w-full ${popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
        />
      </CardFooter>
    </Card>
  )
}
