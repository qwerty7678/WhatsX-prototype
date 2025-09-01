import { useEffect, useState } from 'react'
import api from '../api/client'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [templates, setTemplates] = useState([])
  const [tplName, setTplName] = useState('')
  const [tplBody, setTplBody] = useState('')

  async function loadUsers() {
    const { data } = await api.get('/api/admin/users')
    setUsers(data)
  }

  async function loadTemplates() {
    const { data } = await api.get('/api/templates')
    setTemplates(data)
  }

  useEffect(() => {
    loadUsers()
    loadTemplates()
  }, [])

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

  async function createTemplate(e) {
    e.preventDefault()
    await api.post('/api/templates', { name: tplName, body: tplBody, variables: [] })
    setTplName(''); setTplBody('')
    await loadTemplates()
  }

  async function deleteTemplate(id) {
    await api.delete(`/api/templates/${id}`)
    await loadTemplates()
  }

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">User Management</h2>
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
                <td>
                  <button onClick={()=>deleteUser(u.uid)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Template Management</h2>
        <form onSubmit={createTemplate} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded px-3 py-2" placeholder="Name" value={tplName} onChange={(e)=>setTplName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Body" value={tplBody} onChange={(e)=>setTplBody(e.target.value)} />
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Create</button>
        </form>
        <ul className="space-y-2">
          {templates.map(t => (
            <li key={t.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-gray-600 text-sm truncate">{t.body}</div>
              </div>
              <button onClick={()=>deleteTemplate(t.id)} className="text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

