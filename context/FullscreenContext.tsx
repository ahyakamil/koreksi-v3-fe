import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FullscreenContextType {
  showFullscreen: (content: ReactNode) => void;
  updateFullscreen: (content: ReactNode) => void;
  hideFullscreen: () => void;
  isFullscreen: boolean;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [fullscreenContent, setFullscreenContent] = useState<ReactNode | null>(null);

  const showFullscreen = (content: ReactNode) => {
    setFullscreenContent(content);
  };

  const updateFullscreen = (content: ReactNode) => {
    if (fullscreenContent) {
      setFullscreenContent(content);
    }
  };

  const hideFullscreen = () => {
    setFullscreenContent(null);
  };

  useEffect(() => {
    let originalOverflow = '';
    let originalPosition = '';
    let originalTop = '';
    let originalLeft = '';
    let originalWidth = '';
    let originalHeight = '';

    if (fullscreenContent) {
      originalOverflow = document.body.style.overflow || '';
      originalPosition = document.body.style.position || '';
      originalTop = document.body.style.top || '';
      originalLeft = document.body.style.left || '';
      originalWidth = document.body.style.width || '';
      originalHeight = document.body.style.height || '';

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
    };
  }, [fullscreenContent]);

  return (
    <FullscreenContext.Provider value={{
      showFullscreen,
      updateFullscreen,
      hideFullscreen,
      isFullscreen: fullscreenContent !== null
    }}>
      {children}
      {fullscreenContent && (
        <div
          className="fixed inset-0 z-[999999] bg-black bg-opacity-95 flex items-center justify-center"
          onClick={hideFullscreen}
        >
          {fullscreenContent}
        </div>
      )}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
}