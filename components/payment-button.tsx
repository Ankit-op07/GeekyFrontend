"use client"

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaymentButtonProps {
  kitId: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export function PaymentButton({
  kitId,
  buttonText = 'Buy Now',
  className,
  disabled = false,
}: PaymentButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;
    router.push(`/pay?kit=${encodeURIComponent(kitId)}`);
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      disabled={disabled}
    >
      {disabled ? 'Coming Soon' : buttonText}
    </Button>
  );
}
