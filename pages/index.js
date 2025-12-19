import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '../utils/api'
import PostForm from '../components/PostForm'
import { useAuth } from '../context/AuthContext'
import CommentsList from '../components/CommentsList'
import { formatDate } from '../utils/format'

export default function Home() {
  const { user, loading } = useAuth()
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [pageable, setPageable] = useState(null)

  async function load(){
    const res = await apiFetch(`/posts?page=${page}&size=${size}`)
    if (res.body && res.body.statusCode === 2000) {
      setPosts(res.body.data.content || [])
      setPageable(res.body.data.pageable || null)
    }
  }

  useEffect(() => { load() }, [page, size])

  return (
    <div className="container py-8">
      <main>
        {loading ? (
          <div>Loading...</div>
        ) : user ? (
          <>
            <PostForm onCreated={() => load()} />
            <ul className="space-y-4">
              {posts.map(p => (
                <li key={p.id} className="p-4 bg-white rounded shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">by {p.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{formatDate(p.created_at)}</div>
                  </div>
                  <div className="mt-2">
                    {p.title && <h3 className="font-semibold">{p.title}</h3>}
                    <div className="mt-1">{p.content}</div>
                  </div>
                  <div className="mt-3">
                    <CommentsList postId={p.id} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-2">Public posts</h2>
            <ul className="space-y-4">
              {posts.map(p => (
                <li key={p.id} className="p-4 bg-white rounded shadow">
                  <div className="text-sm text-gray-500">by {p.user?.name || 'Unknown'}</div>
                  <div className="mt-2">{p.content}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pageable && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {pageable.pageNumber + 1} of {pageable.totalPages}</div>
            <div className="space-x-2">
              <button className="px-3 py-1 bg-gray-200 rounded" disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Prev</button>
              <button className="px-3 py-1 bg-gray-200 rounded" disabled={page>=pageable.totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
