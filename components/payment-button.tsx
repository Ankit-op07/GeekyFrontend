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
import { Loader2, CreditCard } from 'lucide-react';
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
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const handlePayment = async () => {
    // Validate email
    if (!userDetails.email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(userDetails.email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setIsProcessing(true);
    
    await initiatePayment({
      amount,
      planName,
      userEmail: userDetails.email,
      userName: userDetails.name,
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        setIsOpen(false);
        setUserDetails({ email: '', name: '' });
        setIsProcessing(false);
        
        // Show additional success message if needed
        setTimeout(() => {
          toast({
            title: 'Access Granted!',
            description: 'You should receive an email within 5 minutes with access to your course materials.',
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
    }, 30000); // 30 seconds timeout
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
          disabled ? 'Coming Soon':buttonText
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Enter your details to purchase {planName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <span className="text-sm">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">₹{amount}</span>
                  {originalAmount && originalAmount > amount && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{originalAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={userDetails.email}
                onChange={handleEmailChange}
                disabled={isProcessing}
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Course access will be sent to this email
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={userDetails.name}
                onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!userDetails.email || !!emailError || isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{amount}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}