import { useState } from 'react'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function Login(){
  const { setUser } = useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState(null)

  async function submit(e){
    e.preventDefault()
    setError(null)
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
      setError(j.message || (j.errCode? j.errCode:'Login failed'))
    }
  }

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
