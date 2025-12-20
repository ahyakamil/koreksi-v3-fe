import { useState } from 'react'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { register } from '../utils/api'


export default function Register(){
  const { setUser } = useAuth()
  const { t } = useLocale()
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const res = await register(name, email, password)
    if(res.ok && res.body && res.body.accessToken){
      const j = res.body
      localStorage.setItem('accessToken', j.accessToken)
      if(j.refreshToken) localStorage.setItem('refreshToken', j.refreshToken)
      if (setUser && j.user) setUser(j.user)
      Router.push('/')
    } else {
      setError(res.body?.message || (res.body?.errCode ? res.body.errCode : 'Register failed'))
    }
    setSubmitting(false)
  }

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">{t('register')}</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm">{t('name')}</label>
          <input className="w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} />
        </div>
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
          <button disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded">{submitting ? t('loading') : t('register')}</button>
        </div>
      </form>
    </div>
  )
}
