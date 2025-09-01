import { useEffect, useState } from 'react'
import api from '../api/client'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  async function loadUsers() {
    const { data } = await api.get('/api/admin/users')
    setUsers(data)
  }

  useEffect(() => { loadUsers() }, [])

  async function createUser(e) {
    e.preventDefault()
    await api.post('/api/admin/users', { email, password, displayName })
    setEmail(''); setPassword(''); setDisplayName('')
    await loadUsers()
  }

  async function deleteUser(uid) {
    await api.delete(`/api/admin/users/${uid}`)
    await loadUsers()
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">User Management</h2>
      <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Display name" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Create</button>
      </form>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Email</th><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid} className="border-t">
              <td className="py-2">{u.email}</td>
              <td>{u.displayName}</td>
              <td><button onClick={()=>deleteUser(u.uid)} className="text-red-600">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

