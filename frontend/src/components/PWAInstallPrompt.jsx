import { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setShowPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      
      // Show manual instructions based on device
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      if (isIOS) {
        alert('iPhone/iPad uchun:\n\n1. Safari brauzerida Share tugmasiga bosing ⬆️\n2. "Add to Home Screen" ni tanlang\n3. "Add" tugmasini bosing');
      } else if (isAndroid) {
        alert('Android uchun:\n\n1. Menu tugmasiga bosing ⋮\n2. "Add to Home screen" yoki "Install app" ni tanlang\n3. "Install" tugmasini bosing');
      } else {
        alert('Desktop uchun:\n\n1. Address bar\'da "Install" icon\'ga bosing\n2. Yoki Menu → "Install Bolajon Med"');
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Show again after 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-3xl">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Ilovani o'rnating
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Bolajon Med ilovasini qurilmangizga o'rnating va offline rejimda ham foydalaning
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                O'rnatish
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Keyinroq
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
