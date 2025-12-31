"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface InstagramEmbedProps {
  reelId: string;
}

export default function InstagramEmbed({ reelId }: InstagramEmbedProps) {
  const blockquoteRef = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const resetStyles = () => {
      document.body.style.touchAction = 'pan-y';
      document.body.style.overflowY = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.touchAction = 'pan-y';
      document.documentElement.style.overflowY = 'auto';
      if (blockquoteRef.current) {
        blockquoteRef.current.style.touchAction = 'pan-y';
      }
    };

    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
      // Force styles after embed processes
      setTimeout(() => {
        resetStyles();
      }, 1000);
    }

    // Reset styles on any touch
    const handleTouch = () => resetStyles();
    document.addEventListener('touchstart', handleTouch, { passive: true });

    // Use MutationObserver to watch for style changes on body and html
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          resetStyles();
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    return () => {
      document.removeEventListener('touchstart', handleTouch);
      observer.disconnect();
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