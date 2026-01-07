export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  userAgent: string;
  platform: string;
}

declare global {
  // Note the capital "W"
  interface Window {
    opera: string;
  }

  interface Navigator {
    msMaxTouchPoints: number;
    standalone: boolean;
  }
}

export default class DeviceDetection {
  /**
   * Detects if the current device is a mobile phone
   */
  static isMobilePhone(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check for mobile patterns in user agent
    const mobileRegex =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

    // Check for tablet patterns (to exclude them)
    const tabletRegex = /iPad|Android(?!.*Mobile)/i;

    const isMobile = mobileRegex.test(userAgent);
    const isTablet = tabletRegex.test(userAgent);

    // Return true only if it's mobile but not a tablet
    return isMobile && !isTablet;
  }

  /**
   * Detects if the current device is a tablet
   */
  static isTablet(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;

    return tabletRegex.test(userAgent);
  }

  /**
   * Detects if the device has touch support
   */
  static hasTouch(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Gets comprehensive device information
   */
  static getDeviceInfo(): DeviceInfo {
    const isMobile = this.isMobilePhone();
    const isTablet = this.isTablet();
    const hasTouch = this.hasTouch();

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      hasTouch,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };
  }

  /**
   * Gets screen orientation
   */
  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Checks if running as a Progressive Web App (PWA)
   */
  static isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true
    );
  }
}
