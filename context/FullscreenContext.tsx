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
    if (fullscreenContent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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