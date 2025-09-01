import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'

export default function UserDashboard() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [message, setMessage] = useState('')
  const [contactsInput, setContactsInput] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get('/api/templates').then(({ data }) => setTemplates(data))
  }, [])

  useEffect(() => {
    const t = templates.find(t => t.id === selectedTemplateId)
    if (t) setMessage(t.body || '')
  }, [selectedTemplateId])

  const uniqueNumbers = useMemo(() => {
    const numbers = contactsInput
      .split(/\s|,|\n|;/)
      .map(s => s.trim())
      .filter(Boolean)
    return Array.from(new Set(numbers))
  }, [contactsInput])

  async function handleSend(e) {
    e.preventDefault()
    const { data } = await api.post('/api/send-message', { toNumbers: uniqueNumbers, messageText: message })
    setResult(data)
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Compose Message</h1>
      <form onSubmit={handleSend} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="border rounded px-3 py-2" value={selectedTemplateId} onChange={(e)=>setSelectedTemplateId(e.target.value)}>
            <option value="">Select template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <textarea className="md:col-span-2 border rounded px-3 py-2 min-h-[80px]" placeholder="Message body" value={message} onChange={(e)=>setMessage(e.target.value)} />
        </div>
        <textarea className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder="Enter phone numbers separated by commas, spaces, or new lines" value={contactsInput} onChange={(e)=>setContactsInput(e.target.value)} />
        <div className="text-sm text-gray-600">Unique recipients: {uniqueNumbers.length}</div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Preview/Send (prototype)</button>
      </form>
      {result && (
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}

