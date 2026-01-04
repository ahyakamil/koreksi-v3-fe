import Link from 'next/link'
import { Space } from '../types'

interface SpaceItemProps {
  space: Space
}

export default function SpaceItem({ space }: SpaceItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow mb-4">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {space.image && (
            <img
              src={space.image}
              alt={space.name}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              <Link href={`/organizations/${space.organization_id}/spaces/${space.id}`} className="hover:text-blue-600">
                {space.name}
              </Link>
            </h3>
            {space.description && (
              <p className="text-gray-600 mb-2 line-clamp-2">
                {space.description}
              </p>
            )}
            <div className="text-sm text-gray-500">
              <Link href={`/organizations/${space.organization_id}`} className="text-blue-500 hover:text-blue-700">
                {space.organization?.title || 'Organization'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}