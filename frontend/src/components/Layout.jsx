import { Outlet, Link, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  MessageSquare, 
  UserCircle,
  Camera
} from 'lucide-react'

const Layout = () => {
  const location = useLocation()
  const { user, email } = useUser()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Profile Setup', href: '/profile-setup', icon: UserCircle },
    { name: 'Relations', href: '/relations', icon: Users },
    { name: 'Reminders', href: '/reminders', icon: Clock },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'Face Recognition', href: '/face-recognition', icon: Camera },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 shadow-xl border-r border-gray-700 z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-700">
            <img 
              src="/Smriti.png" 
              alt="Smriti Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-100">Smriti.AI</h1>
              <p className="text-xs text-gray-400">Dementia Care</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-t border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

