import { useEffect, useState } from 'react'
import api from '../api/client'

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')

  async function load() {
    const { data } = await api.get('/api/templates')
    setTemplates(data)
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    await api.post('/api/templates', { name, body, variables: [] })
    setName(''); setBody('')
    await load()
  }

  async function remove(id) {
    await api.delete(`/api/templates/${id}`)
    await load()
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Template Management</h2>
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Body" value={body} onChange={(e)=>setBody(e.target.value)} />
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Create</button>
      </form>
      <ul className="space-y-2">
        {templates.map(t => (
          <li key={t.id} className="flex items-center justify-between border rounded p-2">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-gray-600 text-sm truncate">{t.body}</div>
            </div>
            <button onClick={()=>remove(t.id)} className="text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

