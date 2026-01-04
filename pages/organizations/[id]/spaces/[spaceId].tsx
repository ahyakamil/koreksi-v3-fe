import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Share2 } from 'lucide-react'
import { Organization, Space, News } from '../../../../types'
import { getOrganization, getSpace, getSpaceNews, checkOrganizationMembership, joinOrganization } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'
import NewsItem from '../../../../components/NewsItem'

interface SpaceDetailPageProps {
  organization: Organization | null
  space: Space | null
}

const SpaceDetailPage: React.FC<SpaceDetailPageProps> = ({ organization: initialOrganization, space: initialSpace }) => {
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization)
  const [space, setSpace] = useState<Space | null>(initialSpace)
  const [news, setNews] = useState<News[]>([])
  const [pageable, setPageable] = useState<any>(null)
  const [loading, setLoading] = useState(!initialOrganization || !initialSpace)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [joining, setJoining] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id, spaceId } = router.query
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id && spaceId && user) {
      fetchData()
    }
  }, [id, spaceId, user])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && pageable && pageable.pageNumber + 1 < pageable.totalPages) {
          loadMoreNews()
        }
      },
      { threshold: 1.0 }
    )
    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }
    return () => observer.disconnect()
  }, [loadingMore, pageable, id, spaceId])

  const fetchData = async () => {
    if (!id || !spaceId) return

    // Fetch organization
    const orgRes = await getOrganization(id as string)
    if (orgRes.ok) {
      setOrganization(orgRes.body.data.organization)
    }

    // Fetch the specific space
    const spaceRes = await getSpace(id as string, spaceId as string)
    if (spaceRes.ok && spaceRes.body.data) {
      setSpace(spaceRes.body.data.space)
    }

    // Check membership if authenticated
    if (user) {
      const membershipRes = await checkOrganizationMembership(id as string)
      if (membershipRes.ok) {
        setIsMember(membershipRes.body.data.is_member)
      }
    }

    // Fetch news for space
    const newsRes = await getSpaceNews(id as string, spaceId as string)
    if (newsRes.ok && newsRes.body && newsRes.body.data) {
      setNews(newsRes.body.data.content || [])
      setPageable(newsRes.body.data.pageable)
      setSubscriptionError(null)
    } else {
      setNews([])
      setPageable(null)
      if (newsRes.body && newsRes.body.errCode === 'SUBSCRIPTION_REQUIRED') {
        setSubscriptionError(newsRes.body.message)
      }
    }

    setLoading(false)
  }

  const loadMoreNews = async () => {
    if (!pageable || loadingMore) return
    const nextPage = pageable.pageNumber + 1
    if (nextPage >= pageable.totalPages) return

    setLoadingMore(true)
    const newsRes = await getSpaceNews(id as string, spaceId as string, nextPage)
    if (newsRes.ok) {
      setNews(prev => [...prev, ...newsRes.body.data.content])
      setPageable(newsRes.body.data.pageable)
    }
    setLoadingMore(false)
  }

  const handleJoin = async () => {
    if (!organization || joining) return
    setJoining(true)
    const res = await joinOrganization(organization.id)
    if (res.ok) {
      setIsMember(true)
      // Refresh data to show news
      fetchData()
    } else {
      alert(res.body.message || t('failed_to_join_organization'))
    }
    setJoining(false)
  }

  if (!user) return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('login_required')}</h3>
        <p className="text-blue-700 mb-4">
          {t('please_login_to_view_this_page')}
        </p>
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {t('login')}
        </Link>
      </div>
    </div>
  )
  if (loading) return <div>{t('loading')}</div>
  if (!organization || !space) return <div>{t('not_found')}</div>

  const handleShare = () => {
    const url = window.location.href
    const title = `${space.name} - ${organization?.title}`
    if (navigator.share) {
      navigator.share({
        title,
        url
      }).catch(() => {
      })
    }
  }

  const ogImage = space?.image || '/icon-512x512.png'
  const ogTitle = `${space?.name || 'Space'} - ${organization?.title || 'Koreksi.org'}`
  const ogDescription = space?.description || `Explore content in ${space?.name} space on Koreksi.org`
  const ogUrl = `https://koreksi.org/organizations/${id}/spaces/${spaceId}`

  return (
    <>
      <Head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Koreksi.org" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <div>
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link href={`/organizations/${id}`}>
                <h1 className="text-3xl font-bold text-blue-600 hover:text-blue-800 cursor-pointer">{organization?.title}</h1>
              </Link>
              <h2 className="text-2xl font-semibold mt-2">{space.name}</h2>
              {space.description && (
                <p className="text-gray-600 mt-2">{space.description}</p>
              )}
            </div>
            <button
              onClick={handleShare}
              className="ml-4 p-2 hover:bg-gray-100 rounded-lg"
              title="Share"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          {space.image && (
            <img src={space.image} alt={space.name} className="w-full h-48 object-contain rounded-lg mt-4" />
          )}
        </div>

      {isMember === false ? (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('join_to_see_published_news')}</h3>
            <p className="text-blue-700 mb-4">
              {t('become_member_to_access_news')}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {joining ? t('joining') : t('join_organization')}
            </button>
          </div>
        </div>
      ) : subscriptionError ? (
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('subscription_required')}</h3>
            <p className="text-yellow-700 mb-4">
              {subscriptionError}
            </p>
            <Link href={`/organizations/${id}`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              {t('go_to_organization_details')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('news')}</h2>
          {news.length === 0 ? (
            <p>{t('no_news_available')}</p>
          ) : (
            <>
              <ul className="space-y-4">
                {news.map(item => (
                  <NewsItem key={item.public_id} news={item} hideOrganization={false} />
                ))}
              </ul>
              {loadingMore && (
                <div className="text-center mt-4">
                  <p>{t('loading_more')}</p>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      )}
    </div>
    </>
  )
}

export async function getServerSideProps(context: any) {
  const { id, spaceId } = context.params
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  try {
    // Fetch organization (public)
    const orgRes = await fetch(`${API_BASE}/organizations/${id}/public`)
    const orgData = orgRes.ok ? await orgRes.json() : null

    // Fetch space (public)
    const spaceRes = await fetch(`${API_BASE}/organizations/${id}/spaces/${spaceId}/public`)
    const spaceData = spaceRes.ok ? await spaceRes.json() : null

    return {
      props: {
        organization: orgData?.data?.organization || null,
        space: spaceData?.data?.space || null,
      },
    }
  } catch (error) {
    return {
      props: {
        organization: null,
        space: null,
      },
    }
  }
}

export default SpaceDetailPage