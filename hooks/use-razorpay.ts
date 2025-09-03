"use client"

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number;
  planName: string;
  userEmail: string;
  userName?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export function useRazorpay() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway. Please refresh and try again.',
        variant: 'destructive',
      });
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

  const initiatePayment = useCallback(async ({
    amount,
    planName,
    userEmail,
    userName = '',
    onSuccess,
    onError,
  }: PaymentOptions) => {
    
    if (!isLoaded) {
      toast({
        title: 'Please wait',
        description: 'Payment system is loading...',
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: 'Initializing payment...',
        description: 'Please wait while we set up your payment.',
      });

      // Create order on backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          planName,
          userEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Geeky Frontend',
        description: planName,
        image: '/logo.png',
        order_id: order.orderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async function (response: any) {
          try {
            // Show processing toast
            toast({
              title: 'Processing payment...',
              description: 'Verifying your payment, please wait.',
            });

            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userEmail,
                planName,
              }),
            });

            const result = await verifyResponse.json();

            if (verifyResponse.ok && result.verified) {
              // SUCCESS - Show success toast
              toast({
                title: '✅ Payment Successful!',
                description: `Thank you for purchasing ${planName}. Check your email for access details.`,
                duration: 5000,
              });

              // Call success callback
              onSuccess?.(response);

              // Optional: Redirect to success page after 2 seconds
              setTimeout(() => {
                // router.push('/payment-success'); // Uncomment if you have a success page
              }, 2000);

            } else {
              throw new Error(result.error || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Verification error:', error);
            toast({
              title: 'Verification Failed',
              description: error.message || 'Payment was received but verification failed. Please contact support.',
              variant: 'destructive',
              duration: 5000,
            });
            onError?.(error);
          }
        },
        modal: {
          ondismiss: function () {
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment process.',
              variant: 'destructive',
            });
          },
        },
        notes: {
          userEmail,
          planName,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment Failed',
          description: response.error.description || 'Payment could not be processed.',
          variant: 'destructive',
          duration: 5000,
        });
        onError?.(response.error);
      });
      
      razorpay.open();
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      onError?.(error);
    }
  }, [toast, router, isLoaded]);

  return { initiatePayment, isLoaded };
}