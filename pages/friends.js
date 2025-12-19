import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

export default function Friends(){
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [friendId, setFriendId] = useState('')
  const [msg, setMsg] = useState(null)

  async function load(){
    const f = await apiFetch('/friends')
    if (f.body && f.body.statusCode===2000) setFriends(f.body.data.friends || [])
    const r = await apiFetch('/friends/requests')
    if (r.body && r.body.statusCode===2000) setRequests(r.body.data.requests || [])
  }

  useEffect(()=>{ load() }, [])

  async function send(){
    setMsg(null)
    const res = await apiFetch('/friends/request', { method: 'POST', body: JSON.stringify({ friend_id: Number(friendId) }) })
    if (res.body && res.body.statusCode===2000) { setMsg('Request sent'); setFriendId(''); load() }
    else setMsg(res.body?.message || 'Error')
  }

  async function accept(id){
    await apiFetch(`/friends/${id}/accept`, { method: 'POST' }); load()
  }

  async function decline(id){
    await apiFetch(`/friends/${id}/decline`, { method: 'POST' }); load()
  }

  async function removeFriend(id){
    await apiFetch(`/friends/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">Friends</h2>

      <section className="mb-6">
        <h3 className="font-medium">Send Friend Request</h3>
        <div className="flex items-center space-x-2 mt-2 max-w-sm">
          <input className="flex-1 border rounded p-2" placeholder="friend user id" value={friendId} onChange={e=>setFriendId(e.target.value)} />
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={send}>Send</button>
        </div>
        {msg && <div className="mt-2 text-sm text-gray-600">{msg}</div>}
      </section>

      <section className="mb-6">
        <h3 className="font-medium">Incoming Requests</h3>
        {requests.length===0 && <div className="text-sm text-gray-600">No requests</div>}
        <ul className="space-y-2 mt-2">
          {requests.map(r=> (
            <li key={r.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
              <div>From: {r.user_id}</div>
              <div className="space-x-2">
                <button onClick={()=>accept(r.id)} className="px-2 py-1 bg-green-500 text-white rounded">Accept</button>
                <button onClick={()=>decline(r.id)} className="px-2 py-1 bg-gray-300 rounded">Decline</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-medium">Friends</h3>
        {friends.length===0 && <div className="text-sm text-gray-600">No friends yet</div>}
        <ul className="space-y-2 mt-2">
          {friends.map(u=> (
            <li key={u.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
              <div>{u.name || u.email} (id: {u.id})</div>
              <div>
                <button onClick={()=>removeFriend(u.id)} className="px-2 py-1 bg-red-500 text-white rounded">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
