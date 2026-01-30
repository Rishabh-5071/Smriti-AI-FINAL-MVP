import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { addReminder, deleteReminder } from '../services/api'
import { Clock, Plus, Trash2, X, Bell } from 'lucide-react'

const Reminders = () => {
  const { user, email, loadUser: refreshUser } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState(null)
  const [formData, setFormData] = useState({
    time: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reminders = user?.reminders || []

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please set up your profile first')
      return
    }

    setLoading(true)
    setError('')

    try {
      await addReminder(email, formData.time, formData.message)
      setShowModal(false)
      setFormData({ time: '', message: '' })
      refreshUser()
    } catch (err) {
      setError('Failed to add reminder. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return

    setLoading(true)
    try {
      await deleteReminder(email, reminderToDelete.id)
      setShowDeleteModal(false)
      setReminderToDelete(null)
      refreshUser()
    } catch (err) {
      setError('Failed to delete reminder. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Sort reminders by time
  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
  })

  // Check if a reminder time has passed today
  const isTimePassed = (timeStr) => {
    const now = new Date()
    const [hours, minutes] = timeStr.split(':').map(Number)
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    return now > reminderTime
  }

  // Format time for display (12-hour format)
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Reminders</h1>
          <p className="text-gray-400">
            Set reminders for medication and daily tasks
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img
              src="/Smriti.png"
              alt="Smriti Logo"
              className="w-16 h-16 object-contain opacity-50"
            />
            <Clock className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">
            No Reminders Set
          </h2>
          <p className="text-gray-400 mb-6">
            Create reminders for medication, meals, and other important tasks
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedReminders.map((reminder) => {
            const passed = isTimePassed(reminder.time)
            return (
              <div
                key={reminder.id}
                className={`card hover:shadow-md transition-shadow relative group ${passed ? 'opacity-60' : ''
                  }`}
              >
                {/* Delete button */}
                <button
                  onClick={() => {
                    setReminderToDelete(reminder)
                    setShowDeleteModal(true)
                  }}
                  className="absolute top-3 right-3 p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${passed ? 'bg-gray-600' : 'bg-primary-600'
                      }`}>
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-bold ${passed ? 'text-gray-400' : 'text-gray-100'
                          }`}>
                          {formatTime(reminder.time)}
                        </span>
                        {passed && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full text-xs">
                            Passed
                          </span>
                        )}
                        {!passed && (
                          <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full text-xs">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <p className={`${passed ? 'text-gray-500' : 'text-gray-300'}`}>
                        {reminder.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">Add Reminder</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reminder Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="input-field"
                  placeholder="e.g., Take morning medication"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reminderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/50 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100">Delete Reminder</h2>
            </div>

            <p className="text-gray-300 mb-2">
              Are you sure you want to delete this reminder?
            </p>
            <div className="p-3 bg-gray-700 rounded-lg mb-6">
              <p className="text-gray-200 font-medium">{formatTime(reminderToDelete.time)}</p>
              <p className="text-gray-400 text-sm">{reminderToDelete.message}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setReminderToDelete(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReminder}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reminders
