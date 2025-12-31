import { useState, useEffect } from 'react'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  const handleDismiss = () => {
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-2 py-8 rounded-r-lg flex items-center justify-center z-40 md:hidden cursor-pointer" onClick={handleInstallClick}>
      <span className="text-sm font-medium transform -rotate-90 whitespace-nowrap">Install</span>
    </div>
  )
}

export default PWAInstallPrompt