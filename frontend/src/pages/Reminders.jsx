import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { addReminder, getReminders } from '../services/api'
import { Clock, Plus, Trash2 } from 'lucide-react'

const Reminders = () => {
  const { user, email, loadUser: refreshUser } = useUser()
  const [showModal, setShowModal] = useState(false)
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

  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
  })

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
          {sortedReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-100">
                        {reminder.time}
                      </span>
                    </div>
                    <p className="text-gray-300">{reminder.message}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time (24-hour format)
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
    </div>
  )
}

export default Reminders

