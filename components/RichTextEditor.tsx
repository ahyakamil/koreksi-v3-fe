import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const editorStyle = `
  .custom-quill-editor .ql-editor {
    min-height: 300px;
  }
`

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...',
  className = ''
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Override the default image handler after Quill loads
    const overrideImageHandler = () => {
      const quillEditor = document.querySelector('.ql-editor')
      if (quillEditor) {
        const toolbar = quillEditor.parentElement?.previousElementSibling
        const imageButton = toolbar?.querySelector('.ql-image')

        if (imageButton && !imageButton.hasAttribute('data-handler-attached')) {
          imageButton.setAttribute('data-handler-attached', 'true')

          // Remove any existing click listeners
          const newButton = imageButton.cloneNode(true)
          imageButton.parentNode?.replaceChild(newButton, imageButton)

          newButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopImmediatePropagation()

            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/png,image/jpeg,image/jpg')
            input.style.display = 'none'
            document.body.appendChild(input)

            input.click()

            const cleanup = () => {
              if (document.body.contains(input)) {
                try {
                  document.body.removeChild(input)
                } catch (e) {
                  // Element already removed, ignore
                }
              }
            }

            input.onchange = async () => {
              const file = input.files?.[0]
              if (file) {
                if (!file.type.match(/^image\/(png|jpe?g)$/)) {
                  window.alert('Only PNG and JPG files are allowed.')
                  cleanup()
                  return
                }

                if (file.size > 2 * 1024 * 1024) {
                  window.alert('File size must be less than 2MB.')
                  cleanup()
                  return
                }

                try {
                  const formData = new FormData()
                  formData.append('image', file)

                  const { uploadImage } = await import('../utils/api')
                  const response = await uploadImage(formData)

                  if (response.ok) {
                    const imageUrl = response.body.data.url
                    // Insert the image at cursor position
                    const imgTag = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`

                    // Find the editor element and insert at cursor
                    const editorElement = document.querySelector('.ql-editor') as HTMLElement
                    if (editorElement) {
                      const selection = window.getSelection()
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0)
                        const imgElement = document.createElement('img')
                        imgElement.src = imageUrl
                        imgElement.alt = 'Uploaded image'
                        imgElement.style.maxWidth = '100%'
                        imgElement.style.height = 'auto'

                        range.insertNode(imgElement)

                        // Move cursor after the image
                        range.setStartAfter(imgElement)
                        range.setEndAfter(imgElement)
                        selection.removeAllRanges()
                        selection.addRange(range)

                        // Update the React Quill value
                        const newContent = editorElement.innerHTML
                        onChange(newContent)
                      } else {
                        // Fallback: append to end
                        const currentValue = value || ''
                        const newValue = currentValue + imgTag
                        onChange(newValue)
                      }
                    }
                  } else {
                    window.alert('Failed to upload image.')
                  }
                } catch (error) {
                  window.alert('Error uploading image.')
                }
              }
              cleanup()
            }

            // Clean up if no file selected (longer timeout)
            setTimeout(cleanup, 30000)
          })
        }
      }
    }

    // Delay to ensure Quill is fully loaded
    const timeoutId = setTimeout(overrideImageHandler, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image', 'color', 'background', 'align'
  ]

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{ __html: editorStyle }} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className="custom-quill-editor"
      />
    </div>
  )
}

export default RichTextEditor