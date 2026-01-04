import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { addRelation } from '../services/api'
import { Users, Plus, Upload, X } from 'lucide-react'

const Relations = () => {
  const { user, email, loadUser: refreshUser } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    photo: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const relations = user?.relations || []

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
      const relation = {
        id: `relation-${Date.now()}`,
        name: formData.name,
        relationship: formData.relationship,
        photo: formData.photo || null,
        messages: [],
        count: { value: 0 },
      }

      await addRelation(email, relation)
      setShowModal(false)
      setFormData({ name: '', relationship: '', photo: '' })
      refreshUser()
    } catch (err) {
      setError('Failed to add relation. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const relationships = [
    'Spouse',
    'Son',
    'Daughter',
    'Father',
    'Mother',
    'Brother',
    'Sister',
    'Friend',
    'Caregiver',
    'Other',
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Family & Relations</h1>
          <p className="text-gray-400">
            Manage family members and caregivers for facial recognition
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Relation
        </button>
      </div>

      {relations.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img 
              src="/Smriti.png" 
              alt="Smriti Logo" 
              className="w-16 h-16 object-contain opacity-50"
            />
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">
            No Relations Added Yet
          </h2>
          <p className="text-gray-400 mb-6">
            Add family members and caregivers to enable facial recognition
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Your First Relation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relations.map((relation) => (
            <div key={relation.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {relation.photo ? (
                  <img
                    src={relation.photo}
                    alt={relation.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-100 mb-1">
                    {relation.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {relation.relationship}
                  </p>
                  {relation.count && (
                    <p className="text-xs text-gray-500">
                      {relation.count.value} interactions
                    </p>
                  )}
                </div>
              </div>
              {relation.summary && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-200">{relation.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Relation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">Add Relation</h2>
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
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Relationship
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select relationship</option>
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  name="photo"
                  value={formData.photo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Upload images to Imgur or use an image URL
                </p>
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
                  {loading ? 'Adding...' : 'Add Relation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Relations

