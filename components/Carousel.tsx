import { useState } from 'react'
import { Media } from '../types'
import { useLocale } from '../context/LocaleContext'

interface CarouselProps {
  medias: Media[]
}

export default function Carousel({ medias }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t } = useLocale()

  if (medias.length === 0) return null

  const next = () => setCurrentIndex((prev) => (prev + 1) % medias.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + medias.length) % medias.length)

  return (
    <div className="relative mt-2">
      <div className="relative overflow-hidden rounded">
        <img
          src={medias[currentIndex].url}
          alt={t('post_media')}
          className="w-full h-64 object-cover"
        />
        {medias.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {medias.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}