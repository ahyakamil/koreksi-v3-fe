import Link from 'next/link'
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import { Post } from '../types'

interface PostItemProps {
  post: Post
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <li className="p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">by {post.user?.name || 'Unknown'}</div>
        <div className="flex items-center space-x-2">
          <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
          <button
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText(window.location.origin + '/post/' + post.public_id)
              alert('URL copied to clipboard!')
            }}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
      <Link href={`/post/${post.public_id}`} className="block mt-2 hover:bg-gray-50 -m-2 p-2 rounded">
        {post.title && <h3 className="font-semibold">{post.title}</h3>}
        <div className="mt-1">{post.content}</div>
        {post.medias && <Carousel medias={post.medias} />}
      </Link>
      <div className="mt-3">
        <CommentsList postId={post.public_id} />
      </div>
    </li>
  )
}