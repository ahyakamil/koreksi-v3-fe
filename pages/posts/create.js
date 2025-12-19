import { useState } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '../../utils/api'

export default function CreatePost(){
  const [content,setContent] = useState('')
  const [image,setImage] = useState('')
  const [error,setError] = useState(null)
  const router = useRouter()

  async function submit(e){
    e.preventDefault()
    setError(null)
    const { ok, body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ content, image }) })
    if (body && body.statusCode === 2000) {
      router.push('/')
    } else {
      setError((body && (body.message || body.errCode)) || 'Error')
    }
  }

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">Create Post</h2>
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <div>
          <textarea rows={6} className="w-full border rounded p-2" value={content} onChange={e=>setContent(e.target.value)} placeholder="Write something..." />
        </div>
        <div>
          <input className="w-full border rounded p-2" placeholder="Image URL (optional)" value={image} onChange={e=>setImage(e.target.value)} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Post</button>
        </div>
      </form>
    </div>
  )
}
