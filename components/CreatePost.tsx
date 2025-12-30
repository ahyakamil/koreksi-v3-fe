'use client'

import { useState } from 'react';
import { Image, Video, Smile } from 'lucide-react';
import { apiFetch, uploadImage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import MultiImageUpload from './MultiImageUpload';
import { Avatar } from './Avatar';

interface CreatePostProps {
  onCreated?: (post: any) => void;
}

export function CreatePost({ onCreated }: CreatePostProps) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [youtubeVideo, setYoutubeVideo] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { t } = useLocale();

  const handleFilesSelected = (files: File[]) => {
    setImageFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const medias: any[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await uploadImage(formData);
      if (!uploadRes.ok || !uploadRes.body?.data?.url) {
        setError(`Failed to upload ${file.name}`);
        setSubmitting(false);
        return;
      }
      medias.push({
        url: uploadRes.body.data.url,
        type: i === 0 ? 'main' : 'additional',
        order: i
      });
    }

    const { body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ title, content, youtube_video: youtubeVideo, medias }) });
    if (body && body.statusCode === 2000) {
      setTitle('');
      setContent('');
      setYoutubeVideo('');
      setImageFiles([]);
      setExpanded(false);
      if (onCreated) onCreated(body.data.post);
    } else {
      setError(body?.message || body?.errCode || 'Error');
    }
    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 px-2 py-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          name={user?.name || 'You'}
          size={40}
        />
        {!expanded && (
          <input
            type="text"
            placeholder={t('share_story_placeholder')}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"
            onClick={() => setExpanded(true)}
            readOnly={!expanded}
            value={expanded ? title : ''}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </div>

      {expanded && (
        <>
          <input
            type="text"
            className="w-full border rounded p-2 mb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${t('title')} (optional)`}
          />
          <textarea
            rows={3}
            className="w-full border rounded p-2 mb-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('content_placeholder')}
          />
          <input
            type="text"
            placeholder="YouTube Video ID"
            className="w-full border rounded p-2 mb-2"
            value={youtubeVideo}
            onChange={(e) => setYoutubeVideo(e.target.value)}
          />
          <MultiImageUpload
            onFilesSelected={handleFilesSelected}
            selectedFiles={imageFiles}
            disabled={submitting}
          />
          {error && <div className="text-red-600 mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('loading') : t('post_button')}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
