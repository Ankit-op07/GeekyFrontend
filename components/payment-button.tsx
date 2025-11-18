"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/use-razorpay';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentButtonProps {
  amount: number;
  originalAmount?: number;
  planName: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export function PaymentButton({
  amount,
  originalAmount,
  planName,
  buttonText = 'Buy Now',
  className,
  disabled = false,
}: PaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userDetails, setUserDetails] = useState({
    email: '',
    name: '',
  });
  const [emailError, setEmailError] = useState('');
  const { initiatePayment, isLoaded } = useRazorpay();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setUserDetails(prev => ({ ...prev, email }));
    
    if (email && !validateEmail(email)) {
      setEmailError('Invalid email');
    } else {
      setEmailError('');
    }
  };

  // Function to send conversion event to Meta
  const trackMetaConversion = async (email: string, name: string) => {
    try {
      await fetch('/api/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'Purchase',
          user_data: {
            em: email, // Will be hashed server-side
            ph: null,
          },
          custom_data: {
            currency: 'INR',
            value: amount.toString(),
            content_type: 'course',
            content_ids: ['nodejs-interview-kit'],
            content_name: planName,
          },
        }),
      });
    } catch (error) {
      console.error('Meta conversion tracking error:', error);
      // Don't block user flow if tracking fails
    }
  };

  const handlePayment = async () => {
    // Validate email
    if (!userDetails.email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(userDetails.email)) {
      setEmailError('Invalid email');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 1000);
    
    await initiatePayment({
      amount,
      planName,
      userEmail: userDetails.email,
      userName: userDetails.name,
      onSuccess: async (response) => {
        // Track Meta conversion on successful payment
        if(planName === "Node.js Interview Preparation Kit"){
        await trackMetaConversion(userDetails.email, userDetails.name);
        }
        
        setUserDetails({ email: '', name: '' });
        setIsProcessing(false);
        
        // Show additional success message if needed
        setTimeout(() => {
          toast({
            title: 'Access Granted!',
            description: 'Check your email for course access.',
          });
        }, 3000);
      },
      onError: (error) => {
        console.error('Payment error:', error);
        setIsProcessing(false);
      },
    });
    
    // Reset processing state after timeout (fallback)
    setTimeout(() => {
      setIsProcessing(false);
    }, 30000);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        disabled={disabled || !isLoaded}
      >
        {!isLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          disabled ? 'Coming Soon' : buttonText
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isProcessing) {
          setIsOpen(open);
          if (!open) {
            setEmailError('');
          }
        }
      }}>
        <DialogContent className="sm:max-w-md max-w-[95%] rounded-2xl p-0 overflow-hidden border-0">
          {/* Beautiful Gradient Header */}
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-white text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Almost There!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm mt-1">
                Complete your purchase
              </DialogDescription>
            </DialogHeader>

            {/* Plan Card */}
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs">You're getting</p>
                  <p className="text-white font-semibold text-sm">{planName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">₹{amount}</span>
                    {originalAmount && originalAmount > amount && (
                      <span className="text-xs text-white/60 line-through">
                        ₹{originalAmount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-6 space-y-4 -mt-4 bg-white dark:bg-gray-900 rounded-t-2xl relative">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={userDetails.email}
                onChange={handleEmailChange}
                disabled={isProcessing}
                className={`h-11 ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
            </div>
            
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Name <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={userDetails.name}
                onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                disabled={isProcessing}
                className="h-11"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!userDetails.email || !!emailError || isProcessing}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>Pay ₹{amount}</>
                )}
              </Button>
            </div>

            {/* Secure Payment Text */}
            <p className="text-center text-xs text-muted-foreground pt-2">
              🔒 Secure payment via Razorpay
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
