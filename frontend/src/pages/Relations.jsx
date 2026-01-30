import { useState, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { addRelation, deleteRelation } from '../services/api'
import { Users, Plus, X, CheckCircle, AlertCircle, Trash2, Camera, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

const Relations = () => {
  const { user, email, loadUser: refreshUser } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [relationToDelete, setRelationToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    photo: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Handle image file upload and convert to base64
  const handleImageUpload = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, photo: e.target.result }))
    }
    reader.onerror = () => {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

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
        isRegistered: false, // Face not registered yet
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

  const handleDeleteRelation = async () => {
    if (!relationToDelete) return

    setLoading(true)
    try {
      await deleteRelation(email, relationToDelete.id)
      setShowDeleteModal(false)
      setRelationToDelete(null)
      refreshUser()
    } catch (err) {
      setError('Failed to delete relation. Please try again.')
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
    'Doctor',
    'Nurse',
    'Other',
  ]

  const registeredCount = relations.filter(r => r.isRegistered).length
  const unregisteredCount = relations.filter(r => !r.isRegistered).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Family & Relations</h1>
          <p className="text-gray-400">
            Manage family members and caregivers for facial recognition
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-400">{registeredCount} registered</span>
            </span>
            {unregisteredCount > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-400">{unregisteredCount} need face registration</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Relation
        </button>
      </div>

      {/* Registration reminder */}
      {unregisteredCount > 0 && (
        <div className="mb-6 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <p className="text-orange-300 font-medium">Face Registration Required</p>
              <p className="text-orange-400/80 text-sm mt-1">
                {unregisteredCount} relation(s) need their face registered for recognition.
                Go to <Link to="/face-recognition" className="underline hover:text-orange-300">Face Recognition</Link> and
                click on their face when detected to register.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div key={relation.id} className="card hover:shadow-md transition-shadow relative group">
              {/* Delete button */}
              <button
                onClick={() => {
                  setRelationToDelete(relation)
                  setShowDeleteModal(true)
                }}
                className="absolute top-3 right-3 p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Delete relation"
              >
                <Trash2 className="w-4 h-4" />
              </button>

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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-100">{relation.name}</h3>
                    {relation.isRegistered ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Registered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded-full text-xs">
                        <Camera className="w-3 h-3" />
                        Not Registered
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{relation.relationship}</p>
                  {relation.count && (
                    <p className="text-xs text-gray-500">
                      {relation.count.value || 0} interactions
                    </p>
                  )}
                </div>
              </div>

              {/* Last conversation summary */}
              {relation.lastSummary && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Last conversation:</p>
                  <p className="text-sm text-gray-200">{relation.lastSummary}</p>
                </div>
              )}

              {!relation.isRegistered && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <Link
                    to="/face-recognition"
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Camera className="w-4 h-4" />
                    Register face for recognition
                  </Link>
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

            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 After adding, go to Face Recognition to register their face for automatic recognition.
              </p>
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
                  Photo (Optional)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
                    ${isDragging
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file && file.type.startsWith('image/')) {
                      handleImageUpload(file)
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                    }}
                  />

                  {formData.photo ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData(prev => ({ ...prev, photo: '' }))
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {isDragging ? 'Drop image here' : 'Drag & drop an image or click to browse'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  You can also capture their photo during face registration
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && relationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/50 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100">Delete Relation</h2>
            </div>

            <p className="text-gray-300 mb-2">
              Are you sure you want to delete <span className="font-bold">{relationToDelete.name}</span>?
            </p>
            <p className="text-gray-400 text-sm mb-6">
              This will remove all associated data including conversation history. This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setRelationToDelete(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRelation}
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

export default Relations
