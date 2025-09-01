import { useState } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onLogin?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      onLogin?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2">Sign in</button>
        </form>
        <button onClick={handleGoogle} className="w-full border rounded px-3 py-2">Continue with Google</button>
      </div>
    </div>
  )
}

