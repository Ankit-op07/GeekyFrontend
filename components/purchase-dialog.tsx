"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type PurchaseDialogProps = {
  planName: string
  priceINR: number
  triggerClassName?: string
}

export function PurchaseDialog({ planName, priceINR, triggerClassName }: PurchaseDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    toast({
      title: "We’ll reach out shortly",
      description: `Your interest in ${planName} (₹${priceINR}) has been recorded for ${email}.`,
    })
    setOpen(false)
    setEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>Get this plan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get {planName}</DialogTitle>
          <DialogDescription>
            Secure checkout coming soon. Leave your email and we’ll send purchase instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue • ₹{priceINR}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
