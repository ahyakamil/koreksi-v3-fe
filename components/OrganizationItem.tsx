import React from 'react'
import { useRouter } from 'next/router'
import { Organization } from '../types'

interface OrganizationItemProps {
  organization: Organization
  onEdit?: (org: Organization) => void
  onDelete?: (id: string) => void
  onJoin?: (id: string) => void
  onLeave?: (id: string) => void
  onUpdate?: (org: Organization) => void
  currentUserRole?: string
}

const OrganizationItem: React.FC<OrganizationItemProps> = ({
  organization,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
  onUpdate,
  currentUserRole
}) => {
  const router = useRouter()
  const isMember = !!currentUserRole

  const handleCardClick = () => {
    router.push(`/organizations/${organization.id}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{organization.title}</h3>
            {organization.verified && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Verified</span>
            )}
          </div>
          {organization.description && (
            <p className="text-gray-600 mb-4">{organization.description}</p>
          )}
          <div className="mb-4">
            {organization.image ? (
              <img src={organization.image} alt={organization.title} className="w-full h-48 object-contain rounded-lg" />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Members: {organization.users?.length || 0}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
        {currentUserRole === 'admin' && (
          <>
            <button
              onClick={() => onEdit?.(organization)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(organization.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </>
        )}
        {!isMember && (
          <button
            onClick={() => onJoin?.(organization.id)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Join
          </button>
        )}
        {isMember && currentUserRole !== 'admin' && (
          <button
            onClick={() => onLeave?.(organization.id)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Leave
          </button>
        )}
        {currentUserRole && (
          <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm">
            Role: {currentUserRole}
          </span>
        )}
      </div>
    </div>
  )
}

export default OrganizationItem