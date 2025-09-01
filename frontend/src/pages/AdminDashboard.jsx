import Dashboard from '../components/Dashboard'
import UserManagement from '../components/UserManagement'
import TemplateManagement from '../components/TemplateManagement'

export default function AdminDashboard() {
  return (
    <Dashboard title="Admin Dashboard">
      <UserManagement />
      <TemplateManagement />
    </Dashboard>
  )
}

