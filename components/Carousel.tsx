import { useState, useEffect } from 'react'
import { Media } from '../types'
import { useLocale } from '../context/LocaleContext'

interface CarouselProps {
  medias: Media[]
  youtubeVideo?: string
}

type Slide = { type: 'image', url: string } | { type: 'video', id: string }

export default function Carousel({ medias, youtubeVideo }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const { t } = useLocale()

  useEffect(() => {
    if (zoomed) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [zoomed])

  const slides: Slide[] = []
  if (youtubeVideo) slides.push({ type: 'video', id: youtubeVideo })
  medias.forEach(m => slides.push({ type: 'image', url: m.url }))

  if (slides.length === 0) return null

  const next = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <div className="relative mt-2">
      <div className="relative overflow-hidden rounded">
        {slides[currentIndex].type === 'image' ? (
          <img
            src={slides[currentIndex].url}
            alt={t('post_media')}
            className="w-full h-64 object-contain cursor-pointer"
            onClick={() => setZoomed(true)}
          />
        ) : (
          <iframe
            width="100%"
            height="256"
            src={`https://www.youtube.com/embed/${slides[currentIndex].id}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="cursor-pointer"
            onClick={() => setZoomed(true)}
          ></iframe>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-4 h-4 rounded-full transition-all ${index === currentIndex ? 'bg-blue-500 ring-2 ring-white' : 'bg-gray-400 hover:bg-gray-300'}`}
                title={slide.type === 'video' ? 'YouTube Video' : 'Image'}
              />
            ))}
          </div>
        )}
      </div>

      {zoomed && (
        <div className="fixed top-12 inset-x-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center z-40" onClick={() => setZoomed(false)}>
          {slides[currentIndex].type === 'image' ? (
            <img src={slides[currentIndex].url} alt="" className="max-w-full max-h-full" />
          ) : (
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${slides[currentIndex].id}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="max-w-full max-h-full"
            ></iframe>
          )}
          {slides.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 text-5xl z-20"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 text-5xl z-20"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {slides.map((slide, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                    className={`w-4 h-4 rounded-full transition-all ${index === currentIndex ? 'bg-blue-500 ring-2 ring-white' : 'bg-gray-400 hover:bg-gray-300'}`}
                    title={slide.type === 'video' ? 'YouTube Video' : 'Image'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}