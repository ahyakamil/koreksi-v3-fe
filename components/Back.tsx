'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

interface BackProps {
  className?: string;
}

export function Back({ className = '' }: BackProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Normal inline button */}
      {!isScrolled && (
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        >
          <ArrowLeft className="w-5 h-5" />
          {t('back')}
        </button>
      )}

      {/* Fixed button when scrolled */}
      {isScrolled && (
        <button
          onClick={handleBack}
          className={`fixed ${isMobile ? 'top-2' : 'top-14'} left-4 bg-white z-10 flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shadow-md`}
        >
          <ArrowLeft className="w-5 h-5" />
          {t('back')}
        </button>
      )}
    </>
  );
}