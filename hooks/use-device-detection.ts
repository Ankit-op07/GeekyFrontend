// hooks/use-device-detection.ts
"use client"

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isAppleDevice: boolean;
  deviceType: 'ios' | 'mac' | 'android' | 'windows' | 'other';
  isLoading: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAppleDevice: false,
    deviceType: 'other',
    isLoading: true
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const platform = window.navigator.platform?.toLowerCase() || '';
      
      // Check for iOS devices (iPhone, iPad, iPod)
      const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                    (platform === 'iphone' || platform === 'ipad' || platform === 'ipod') ||
                    // iOS 13+ detection (iPadOS reports as Mac)
                    (platform === 'macintel' && navigator.maxTouchPoints > 1);
      
      // Check for Mac
      const isMac = platform.startsWith('mac') && navigator.maxTouchPoints <= 1;
      
      // Check for Android
      const isAndroid = /android/.test(userAgent);
      
      // Check for Windows
      const isWindows = /windows|win32|win64/.test(userAgent) || platform.startsWith('win');
      
      let deviceType: 'ios' | 'mac' | 'android' | 'windows' | 'other' = 'other';
      
      if (isIOS) {
        deviceType = 'ios';
      } else if (isMac) {
        deviceType = 'mac';
      } else if (isAndroid) {
        deviceType = 'android';
      } else if (isWindows) {
        deviceType = 'windows';
      }
      
      setDeviceInfo({
        isAppleDevice: isIOS || isMac,
        deviceType,
        isLoading: false
      });
    };

    // Run detection after component mounts (client-side only)
    detectDevice();
  }, []);

  return deviceInfo;
}

// Pricing configuration based on device
export interface PricingConfig {
  js: {
    current: number;
    original: number;
  };
  complete: {
    current: number;
    original: number;
  };
  experiences: {
    current: number;
    original: number | null;
  };
}

export function useDevicePricing(): PricingConfig & { isLoading: boolean } {
  const { isAppleDevice, isLoading } = useDeviceDetection();
  
  // Apple device pricing (premium)
  const applePricing: PricingConfig = {
    js: {
      current: 99,
      original: 199
    },
    complete: {
      current: 199,
      original: 399
    },
    experiences: {
      current: 399,
      original: null
    }
  };
  
  // Regular pricing
  const regularPricing: PricingConfig = {
    js: {
      current: 49,
      original: 99
    },
    complete: {
      current: 149,
      original: 299
    },
    experiences: {
      current: 399,
      original: null
    }
  };
  
  const pricing = isAppleDevice ? applePricing : regularPricing;
  
  return {
    ...pricing,
    isLoading
  };
}