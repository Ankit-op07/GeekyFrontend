"use client"

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

/**
 * Razorpay checkout for a MEMBERSHIP.
 *
 * Separate from use-razorpay.ts, which hardcodes /api/payment/create-order and
 * /api/payment/verify and passes a `planName` the server looks up in the KIT
 * catalogue. Threading "is this a membership" through that hook would mean every
 * branch of a shared checkout has to remember which product it is handling —
 * the same reason the API routes are separate. The Razorpay widget itself is
 * the only thing worth sharing, and it is four lines.
 *
 * The client sends a plan ID. It never sends an amount: the order is priced from
 * MEMBERSHIP_PLANS on the server, so nothing here can change what is charged.
 */
export function useMembershipCheckout() {
    const { toast } = useToast()
    const [isLoaded, setIsLoaded] = useState(false)
    const [busyPlanId, setBusyPlanId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if ((window as any).Razorpay) {
            setIsLoaded(true)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () =>
            toast({
                title: 'Could not load checkout',
                description: 'Please refresh the page and try again.',
                variant: 'destructive',
            })
        document.body.appendChild(script)
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script)
        }
    }, [toast])

    const buyMembership = useCallback(
        async (planId: string, onSuccess?: (expiresAt: string | null) => void) => {
            if (!isLoaded) {
                toast({ title: 'Please wait', description: 'Checkout is still loading…' })
                return
            }

            setBusyPlanId(planId)
            try {
                const res = await fetch('/api/membership/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                })
                const order = await res.json()

                if (!res.ok) {
                    // Membership checkout requires an account (see the route's
                    // header), so "sign in first" is a normal outcome, not an
                    // error to apologise for.
                    if (order.needsAuth) {
                        toast({
                            title: 'Sign in to continue',
                            description: 'A membership is attached to your account.',
                        })
                        window.location.href = `/login?next=${encodeURIComponent('/membership')}`
                        return
                    }
                    throw new Error(order.error || 'Could not start checkout')
                }

                const rzp = new (window as any).Razorpay({
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'Geeky Frontend',
                    description: `${order.plan.label} Membership`,
                    image: '/logo.png',
                    order_id: order.orderId,
                    prefill: { name: order.prefill?.name || '', email: order.prefill?.email || '' },
                    theme: { color: '#7c3aed' },
                    handler: async (response: any) => {
                        try {
                            const verify = await fetch('/api/membership/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    planId,
                                }),
                            })
                            const result = await verify.json()
                            if (!verify.ok || !result.success) {
                                throw new Error(result.error || 'Verification failed')
                            }
                            toast({
                                title: '🎉 Membership active',
                                description: 'Everything is unlocked. Check your email for the receipt.',
                                duration: 6000,
                            })
                            onSuccess?.(result.expiresAt ?? null)
                        } catch (err: any) {
                            /* The payment succeeded — only our confirmation call
                             * failed. Never tell someone their payment failed
                             * here; the webhook grants the membership
                             * independently, so the truthful message is "it is
                             * on its way", not "it did not work". */
                            toast({
                                title: 'Payment received',
                                description:
                                    'We are still confirming it. Your membership will be active within a minute — refresh the page shortly.',
                                duration: 8000,
                            })
                        } finally {
                            setBusyPlanId(null)
                        }
                    },
                    modal: {
                        ondismiss: () => setBusyPlanId(null),
                    },
                })

                rzp.on('payment.failed', (response: any) => {
                    toast({
                        title: 'Payment failed',
                        description: response?.error?.description || 'The payment could not be processed.',
                        variant: 'destructive',
                    })
                    setBusyPlanId(null)
                })

                rzp.open()
            } catch (err: any) {
                toast({
                    title: 'Something went wrong',
                    description: err.message || 'Could not start checkout.',
                    variant: 'destructive',
                })
                setBusyPlanId(null)
            }
        },
        [isLoaded, toast]
    )

    return { buyMembership, isLoaded, busyPlanId }
}
