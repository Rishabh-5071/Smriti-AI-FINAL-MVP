import { useUser } from '../context/UserContext'
import { Users, Clock, MessageSquare, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { user, loading, email } = useUser()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <img 
          src="/Smriti.png" 
          alt="Smriti Logo" 
          className="w-16 h-16 object-contain animate-pulse"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <img 
            src="/Smriti.png" 
            alt="Smriti Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Welcome to Smriti.AI</h2>
          <p className="text-gray-400 mb-6">
            Get started by setting up your patient profile
          </p>
          <Link to="/profile-setup" className="btn-primary inline-block">
            Set Up Profile
          </Link>
        </div>
      </div>
    )
  }

  const relations = user.relations || []
  const reminders = user.reminders || []
  const totalMessages = relations.reduce((sum, rel) => sum + (rel.messages?.length || 0), 0)

  const stats = [
    {
      name: 'Family Members',
      value: relations.length,
      icon: Users,
      color: 'bg-blue-500',
      href: '/relations',
    },
    {
      name: 'Active Reminders',
      value: reminders.length,
      icon: Clock,
      color: 'bg-green-500',
      href: '/reminders',
    },
    {
      name: 'Conversations',
      value: totalMessages,
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/conversations',
    },
  ]

  const upcomingReminders = reminders
    .map(r => ({
      ...r,
      timeObj: new Date(`2000-01-01T${r.time}:00`)
    }))
    .sort((a, b) => a.timeObj - b.timeObj)
    .slice(0, 3)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-400">
          Here's an overview of your care management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Relations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-100">Recent Relations</h2>
            <Link
              to="/relations"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              View all
            </Link>
          </div>
          {relations.length > 0 ? (
            <div className="space-y-3">
              {relations.slice(0, 3).map((relation) => (
                <div
                  key={relation.id}
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                >
                  {relation.photo ? (
                    <img
                      src={relation.photo}
                      alt={relation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-100">{relation.name}</p>
                    <p className="text-sm text-gray-400">{relation.relationship}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No relations added yet
            </p>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-100">Upcoming Reminders</h2>
            <Link
              to="/reminders"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              View all
            </Link>
          </div>
          {upcomingReminders.length > 0 ? (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-100">{reminder.message}</p>
                    <p className="text-sm text-gray-400">{reminder.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No reminders scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

