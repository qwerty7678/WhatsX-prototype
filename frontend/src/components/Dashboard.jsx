export default function Dashboard({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>
      <main className="p-4 max-w-5xl mx-auto space-y-6">{children}</main>
    </div>
  )
}