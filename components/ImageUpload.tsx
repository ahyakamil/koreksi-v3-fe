import React, { useState, useEffect } from 'react'
import { uploadOrganizationImage } from '../utils/api'

interface ImageUploadProps {
  onFileSelected: (file: File | null) => void
  currentImage?: string
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onFileSelected,
  currentImage,
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(!currentImage)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    setShowUpload(!currentImage && !selectedFile)
  }, [currentImage, selectedFile])

  const processFile = (file: File) => {
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }

    setSelectedFile(file)
    setShowUpload(false)
    setError(null)
    onFileSelected(file)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setShowUpload(true)
    setError(null)
    onFileSelected(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Image
      </label>
      <div className="space-y-4">
        {showUpload && !selectedFile && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('image-upload')?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) {
                await processFile(file)
              }
            }}
          >
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Drop image here or click to browse</p>
              <p className="text-sm">PNG or JPG files only, max 2MB</p>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Image</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative group border rounded-lg overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(selectedFile)} alt={selectedFile.name} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-2 bg-gray-50">
                  <p className="text-xs text-gray-600 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentImage && !selectedFile && !showUpload && (
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Current Image</h4>
            <div className="relative inline-block">
              <img src={currentImage} alt="Current" className="w-32 h-32 object-cover rounded border" />
              <button
                onClick={() => setShowUpload(true)}
                className="absolute top-1 right-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              >
                Change
              </button>
            </div>
          </div>
        )}

        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}

export default ImageUpload