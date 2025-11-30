"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Platform = "ios" | "android" | "other";

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  userAgent: string;
}

/**
 * Hook for detecting mobile devices and platforms
 */
export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: "desktop",
    platform: "other",
    isIOS: false,
    isAndroid: false,
    screenWidth: 0,
    userAgent: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
      const screenWidth = window.innerWidth;

      // Platform detection
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isAndroid = /android/i.test(userAgent);

      // Device type detection based on screen size and user agent
      const isMobileByScreen = screenWidth < 768;
      const isTabletByScreen = screenWidth >= 768 && screenWidth < 1024;

      // Enhanced mobile detection
      const isMobileDevice =
        isMobileByScreen ||
        /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      const isTabletDevice =
        (isTabletByScreen && !isMobileByScreen) ||
        /iPad|Android(?!.*Mobile)/i.test(userAgent);

      const isDesktopDevice = !isMobileDevice && !isTabletDevice;

      let deviceType: DeviceType = "desktop";
      if (isMobileDevice && !isTabletDevice) {
        deviceType = "mobile";
      } else if (isTabletDevice) {
        deviceType = "tablet";
      }

      let platform: Platform = "other";
      if (isIOS) {
        platform = "ios";
      } else if (isAndroid) {
        platform = "android";
      }

      setDetection({
        isMobile: isMobileDevice && !isTabletDevice,
        isTablet: isTabletDevice,
        isDesktop: isDesktopDevice,
        deviceType,
        platform,
        isIOS,
        isAndroid,
        screenWidth,
        userAgent,
      });
    };

    // Initial detection
    detectDevice();

    // Re-detect on resize
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  return detection;
}

/**
 * Check if running in a mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  if (typeof window === "undefined") return "other";

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";

  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios";
  }

  if (/android/i.test(userAgent)) {
    return "android";
  }

  return "other";
}
