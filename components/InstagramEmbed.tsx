"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface InstagramEmbedProps {
  reelId: string;
}

export default function InstagramEmbed({ reelId }: InstagramEmbedProps) {
  const blockquoteRef = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const resetTouchAction = () => {
      document.body.style.touchAction = 'pan-y';
      document.body.style.overflowY = 'auto';
      document.body.style.pointerEvents = 'auto';
      if (blockquoteRef.current) {
        blockquoteRef.current.style.touchAction = 'pan-y';
      }
    };

    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
      // Force touch-action after embed processes
      setTimeout(() => {
        resetTouchAction();
      }, 1000);
    }

    // Reset touch-action on any touch to ensure scrolling works
    document.addEventListener('touchstart', resetTouchAction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', resetTouchAction);
    };
  }, [reelId]);

  return (
    <div className="flex justify-center" style={{ touchAction: 'pan-y' }}>
      <blockquote
        ref={blockquoteRef}
        className="instagram-media"
        data-instgrm-permalink={`https://www.instagram.com/reel/${reelId}/`}
        data-instgrm-version="14"
        style={{ background: "#FFF", maxWidth: 540, width: "100%", touchAction: 'pan-y' }}
      />

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).instgrm?.Embeds.process();
          // Force touch-action after script loads and processes
          setTimeout(() => {
            if (blockquoteRef.current) {
              blockquoteRef.current.style.touchAction = 'pan-y';
            }
          }, 1000);
        }}
      />
    </div>
  );
}