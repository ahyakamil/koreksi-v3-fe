"use client";

import { useEffect } from "react";
import Script from "next/script";

interface InstagramEmbedProps {
  reelId: string;
}

export default function InstagramEmbed({ reelId }: InstagramEmbedProps) {
  useEffect(() => {
    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [reelId]);

  return (
    <div className="flex justify-center" style={{ touchAction: 'auto' }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`https://www.instagram.com/reel/${reelId}/`}
        data-instgrm-version="14"
        style={{ background: "#FFF", maxWidth: 540, width: "100%", touchAction: 'auto' }}
      />

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).instgrm?.Embeds.process();
        }}
      />
    </div>
  );
}