import { useState } from 'react'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function Login(){
  const { setUser } = useAuth()
  const { t } = useLocale()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const res = await fetch(`${API}/auth/login`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email,password})
    })
    const j = await res.json()
    if(res.ok && j.accessToken){
      localStorage.setItem('accessToken', j.accessToken)
      if(j.refreshToken) localStorage.setItem('refreshToken', j.refreshToken)
      if (setUser && j.user) setUser(j.user)
      Router.push('/')
    } else {
      setError(j.message || (j.errCode? j.errCode:t('login_failed')))
    }
    setSubmitting(false)
  }

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">{t('login')}</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm">{t('email')}</label>
          <input className="w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">{t('password')}</label>
          <input type="password" className="w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">{submitting ? t('loading') : t('login')}</button>
        </div>
      </form>
    </div>
  )
}
