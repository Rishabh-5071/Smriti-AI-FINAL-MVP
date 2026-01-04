import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { createUser } from '../services/api'
import { UserCircle, Mail, Users, CheckCircle } from 'lucide-react'

const ProfileSetup = () => {
  const { user, setUserEmail, loadUser } = useUser()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    broadcastList: user?.broadcastList?.join(', ') || '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const broadcastList = formData.broadcastList
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)

      const response = await createUser({
        name: formData.name,
        email: formData.email,
        broadcastList,
      })

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(true)
        setUserEmail(formData.email)
        setTimeout(() => {
          loadUser()
        }, 500)
      }
    } catch (err) {
      setError('Failed to create profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img 
              src="/Smriti.png" 
              alt="Smriti Logo" 
              className="w-16 h-16 object-contain"
            />
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">
            Profile Created Successfully!
          </h2>
          <p className="text-gray-400 mb-6">
            Your patient profile has been set up. You can now add relations and reminders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          Patient Profile Setup
        </h1>
        <p className="text-gray-400">
          Set up the patient's profile with their relevant information
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Patient Name
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter patient's full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="patient@example.com"
            />
          </div>

          {/* Broadcast List */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Caregiver Email Addresses
              </div>
            </label>
            <input
              type="text"
              name="broadcastList"
              value={formData.broadcastList}
              onChange={handleChange}
              className="input-field"
              placeholder="caregiver1@example.com, caregiver2@example.com"
            />
            <p className="mt-1 text-sm text-gray-400">
              Enter email addresses separated by commas. These caregivers will receive notifications.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : user ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup

