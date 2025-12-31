import { useState, useEffect, useMemo, useCallback } from 'react'
import { Media } from '../types'
import { useLocale } from '../context/LocaleContext'
import { useFullscreen } from '../context/FullscreenContext'
import { X } from 'lucide-react'
import InstagramEmbed from './InstagramEmbed'

interface CarouselProps {
  medias: Media[]
  youtubeVideo?: string
  instagramVideo?: string
}

type Slide = { type: 'image', url: string } | { type: 'video', id: string } | { type: 'instagram', id: string }

export default function Carousel({ medias, youtubeVideo, instagramVideo }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullscreenKey, setFullscreenKey] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const { t } = useLocale()
  const { showFullscreen, updateFullscreen, hideFullscreen, isFullscreen } = useFullscreen()

  const slides = useMemo(() => {
    const s: Slide[] = []
    if (youtubeVideo) s.push({ type: 'video', id: youtubeVideo })
    if (instagramVideo) s.push({ type: 'instagram', id: instagramVideo })
    medias.forEach(m => s.push({ type: 'image', url: m.url }))
    return s
  }, [youtubeVideo, instagramVideo, medias])

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(Math.max(0, slides.length - 1))
    }
  }, [slides.length])

  const next = useCallback(() => {
    if (slides.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }
  }, [slides.length])
  const prev = useCallback(() => {
    if (slides.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }
  }, [slides.length])

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) {
      next()
    }
    if (isRightSwipe) {
      prev()
    }
  }

  const createFullscreenContent = () => {
    if (slides.length === 0) return null
    return (
      <div
        key={fullscreenKey}
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
      <button
        onClick={(e) => { e.stopPropagation(); hideFullscreen(); }}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-60 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
      >
        <X className="w-6 h-6" />
      </button>
      {slides[currentIndex].type === 'image' ? (
        <img src={slides[currentIndex].url} alt="" className="max-w-full max-h-full object-contain" />
      ) : slides[currentIndex].type === 'video' ? (
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${slides[currentIndex].id}?autoplay=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="max-w-full max-h-full"
        ></iframe>
      ) : (
        <InstagramEmbed reelId={slides[currentIndex].id} />
      )}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 text-5xl z-20 hover:text-white"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 text-5xl z-20 hover:text-white"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`w-4 h-4 rounded-full transition-all ${index === currentIndex ? 'bg-blue-500 ring-2 ring-white' : 'bg-gray-400 hover:bg-gray-300'}`}
                title={slide.type === 'video' ? 'YouTube Video' : slide.type === 'instagram' ? 'Instagram Video' : 'Image'}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  )
  };

  const openFullscreen = () => {
    showFullscreen(createFullscreenContent());
  };

  // Update fullscreen content when currentIndex changes
  useEffect(() => {
    if (isFullscreen) {
      setFullscreenKey(prev => prev + 1);
      updateFullscreen(createFullscreenContent());
    }
  }, [currentIndex]);

  if (slides.length === 0) return null

  return (
    <div className="mt-2">
      <div
        className="relative overflow-hidden rounded cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={openFullscreen}
      >
        {slides[currentIndex].type === 'image' ? (
          <img
            src={slides[currentIndex].url}
            alt={t('post_media')}
            className="w-full h-64 object-contain"
          />
        ) : slides[currentIndex].type === 'video' ? (
          <iframe
            width="100%"
            height="256"
            src={`https://www.youtube.com/embed/${slides[currentIndex].id}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ pointerEvents: 'none' }}
          ></iframe>
        ) : (
          <div style={{ pointerEvents: 'none' }}>
            <InstagramEmbed reelId={slides[currentIndex].id} />
          </div>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-4 h-4 rounded-full transition-all ${index === currentIndex ? 'bg-blue-500 ring-2 ring-white' : 'bg-gray-400 hover:bg-gray-300'}`}
                title={slide.type === 'video' ? 'YouTube Video' : slide.type === 'instagram' ? 'Instagram Video' : 'Image'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}