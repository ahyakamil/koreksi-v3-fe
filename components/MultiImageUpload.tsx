import React, { useState } from 'react'
import { useLocale } from '../context/LocaleContext'

interface MultiImageUploadProps {
  onFilesSelected: (files: File[]) => void
  selectedFiles: File[]
  disabled?: boolean
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onFilesSelected,
  selectedFiles,
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null)
  const { t } = useLocale()

  const processFiles = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files).filter(file => {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert(t ? t('file_too_large', { name: file.name }) : `File ${file.name} is too large (max 2MB)`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`)
        return false
      }
      return true
    })

    const newFiles = [...selectedFiles, ...fileArray]
    onFilesSelected(newFiles)
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    // Reset input value to allow selecting same files again
    e.target.value = ''
  }

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault()
    processFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    onFilesSelected(newFiles)
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">Upload Images</label>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById('multi-image-upload')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDragDrop}
      >
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium">Drop images here or click to browse</p>
          <p className="text-sm">PNG or JPG files only, max 2MB each</p>
        </div>
      </div>

      <input
        id="multi-image-upload"
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Selected Images Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Images ({selectedFiles.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group border rounded-lg overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-2 bg-gray-50">
                  <p className="text-xs text-gray-600 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default MultiImageUpload