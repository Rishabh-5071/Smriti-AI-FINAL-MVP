import { useUser } from '../context/UserContext'
import { Users, Clock, MessageSquare, Camera, AlertCircle, CheckCircle } from 'lucide-react'
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
  const registeredRelations = relations.filter(r => r.isRegistered)
  const unregisteredRelations = relations.filter(r => !r.isRegistered)

  // Count total conversations from new format
  const totalConversations = relations.reduce((sum, rel) => {
    return sum + (rel.conversations?.length || 0) + (rel.messages?.length || 0)
  }, 0)

  const stats = [
    {
      name: 'Family Members',
      value: relations.length,
      subtext: `${registeredRelations.length} registered`,
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
      value: totalConversations,
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/conversations',
    },
    {
      name: 'Face Recognition',
      value: registeredRelations.length,
      subtext: 'faces registered',
      icon: Camera,
      color: 'bg-orange-500',
      href: '/face-recognition',
    },
  ]

  const upcomingReminders = reminders
    .map(r => ({
      ...r,
      timeObj: new Date(`2000-01-01T${r.time}:00`)
    }))
    .sort((a, b) => a.timeObj - b.timeObj)
    .slice(0, 3)

  // Get recent conversations
  const recentConversations = relations
    .flatMap(rel => (rel.conversations || []).map(conv => ({
      ...conv,
      relationName: rel.name,
      relationship: rel.relationship
    })))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
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

      {/* Alert for unregistered relations */}
      {unregisteredRelations.length > 0 && (
        <div className="mb-6 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-300 font-medium">
                {unregisteredRelations.length} relation(s) need face registration
              </p>
              <p className="text-orange-400/80 text-sm mt-1">
                {unregisteredRelations.map(r => r.name).join(', ')} - Go to{' '}
                <Link to="/face-recognition" className="underline hover:text-orange-300">
                  Face Recognition
                </Link>{' '}
                to register their faces
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {stat.subtext && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                  )}
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
            <h2 className="text-xl font-bold text-gray-100">Family & Relations</h2>
            <Link
              to="/relations"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              View all
            </Link>
          </div>
          {relations.length > 0 ? (
            <div className="space-y-3">
              {relations.slice(0, 4).map((relation) => (
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-100">{relation.name}</p>
                      {relation.isRegistered ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{relation.relationship}</p>
                  </div>
                  {relation.lastSummary && (
                    <p className="text-xs text-gray-500 max-w-[120px] truncate" title={relation.lastSummary}>
                      {relation.lastSummary}
                    </p>
                  )}
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

        {/* Recent Conversations */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-100">Recent Conversations</h2>
            <Link
              to="/conversations"
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              View all
            </Link>
          </div>
          {recentConversations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentConversations.map((conv, idx) => (
                <div
                  key={conv.id || idx}
                  className="p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100 text-sm">{conv.relationName}</p>
                      <p className="text-xs text-gray-500">{conv.relationship}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{conv.summary}</p>
                  {conv.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(conv.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No conversations recorded yet. Start face recognition to begin recording conversations.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary-900/50 to-primary-800/30 border border-primary-700 rounded-lg">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/face-recognition"
            className="btn-primary flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Start Face Recognition
          </Link>
          <Link
            to="/relations"
            className="btn-secondary flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Add Family Member
          </Link>
          <Link
            to="/reminders"
            className="btn-secondary flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Set Reminder
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
