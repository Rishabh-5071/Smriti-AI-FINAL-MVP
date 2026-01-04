import { useEffect, useRef, useState } from 'react'
import { useUser } from '../context/UserContext'
import { addRelation } from '../services/api'
import { Camera, X, Video, VideoOff } from 'lucide-react'
import * as faceapi from 'face-api.js'

const FaceRecognition = () => {
  const { user, email, loadUser } = useUser()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState('')
  const [detectedFaces, setDetectedFaces] = useState([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [showAddRelationModal, setShowAddRelationModal] = useState(false)
  const [selectedFace, setSelectedFace] = useState(null)
  const [newRelationName, setNewRelationName] = useState('')
  const [newRelationType, setNewRelationType] = useState('')
  const [faceDescriptors, setFaceDescriptors] = useState(new Map())

  const relationships = [
    'Spouse', 'Son', 'Daughter', 'Father', 'Mother',
    'Brother', 'Sister', 'Friend', 'Caregiver', 'Other'
  ]

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        setIsLoading(false)
        
        // Load existing relations' face descriptors
        if (user?.relations) {
          loadRelationDescriptors()
        }
      } catch (err) {
        console.error('Error loading models:', err)
        setError('Failed to load face recognition models. Make sure models are in /public/models/')
        setIsLoading(false)
      }
    }
    loadModels()
  }, [])

  // Load descriptors for existing relations (simplified - would need to store descriptors)
  const loadRelationDescriptors = () => {
    // In production, you'd load stored face descriptors from backend
    // For demo, we'll match based on position tracking
  }

  // Start video stream
  const startVideo = async () => {
    try {
      if (!email) {
        setError('Please set up your profile first')
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsDetecting(true)
      setError('')
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please allow camera permissions.')
    }
  }

  // Stop video stream
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setDetectedFaces([])
  }

  // Match face with existing relations
  const matchFace = (descriptor, box) => {
    const relations = user?.relations || []
    
    // Simple position-based tracking for demo
    // In production, use face descriptor matching
    const existingFace = detectedFaces.find(f => {
      const distance = Math.sqrt(
        Math.pow(f.box.x - box.x, 2) + Math.pow(f.box.y - box.y, 2)
      )
      return distance < 100 // Same face if within 100px
    })

    if (existingFace && existingFace.relation) {
      return existingFace.relation
    }

    // For demo: assign first relation if available and no existing match
    // In production, compare descriptors with stored relation descriptors
    if (relations.length > 0 && !existingFace) {
      return relations[0] // Simplified for demo
    }

    return null
  }

  // Detect faces and draw overlays
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !isDetecting) return

    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    const canvas = canvasRef.current
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Set canvas size to match video
    canvas.width = videoWidth
    canvas.height = videoHeight

    const displaySize = { width: videoWidth, height: videoHeight }
    faceapi.matchDimensions(canvas, displaySize)

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceDescriptors()

    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    // Clear canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Process each detected face
    const faces = []
    for (const detection of resizedDetections) {
      const box = detection.detection.box
      const descriptor = detection.descriptor
      
      // Match with existing relations
      const relation = matchFace(descriptor, box)
      
      const faceId = `face-${Date.now()}-${Math.random()}`
      faces.push({
        id: faceId,
        box: box,
        relation: relation,
        descriptor: descriptor,
        isNew: !relation
      })

      // Draw face box
      if (relation) {
        drawRelationOverlay(ctx, box, relation)
      } else {
        drawNewFaceOverlay(ctx, box)
      }
    }

    setDetectedFaces(faces)
  }

  // Draw relation overlay (green, transparent)
  const drawRelationOverlay = (ctx, box, relation) => {
    const padding = 12
    const labelHeight = 70
    const boxWidth = Math.max(box.width, 220)
    
    // Semi-transparent green background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.85)'
    ctx.fillRect(
      box.x,
      box.y - labelHeight - 8,
      boxWidth,
      labelHeight
    )

    // Border
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.strokeRect(
      box.x,
      box.y - labelHeight - 8,
      boxWidth,
      labelHeight
    )

    // Name text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.fillText(
      relation.name || 'Unknown',
      box.x + padding,
      box.y - labelHeight + 25
    )
    
    // Relationship text
    ctx.font = '16px Arial'
    ctx.fillText(
      relation.relationship || 'Unknown',
      box.x + padding,
      box.y - labelHeight + 50
    )

    // Face detection box
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.strokeRect(box.x, box.y, box.width, box.height)
  }

  // Draw new face overlay (orange, transparent)
  const drawNewFaceOverlay = (ctx, box) => {
    const padding = 12
    const labelHeight = 50
    const boxWidth = Math.max(box.width, 250)
    
    // Semi-transparent orange background
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)'
    ctx.fillRect(
      box.x,
      box.y - labelHeight - 8,
      boxWidth,
      labelHeight
    )

    // Border
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.strokeRect(
      box.x,
      box.y - labelHeight - 8,
      boxWidth,
      labelHeight
    )

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText(
      'New Person - Click to Add',
      box.x + padding,
      box.y - labelHeight + 30
    )

    // Face detection box
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.strokeRect(box.x, box.y, box.width, box.height)
  }

  // Detection loop
  useEffect(() => {
    if (!isDetecting || !modelsLoaded) return

    const interval = setInterval(() => {
      detectFaces()
    }, 150) // Detect every 150ms for smooth tracking

    return () => clearInterval(interval)
  }, [isDetecting, modelsLoaded, user, detectedFaces])

  // Handle adding new relation
  const handleAddRelation = async () => {
    if (!email || !newRelationName || !newRelationType) {
      setError('Please fill in all fields')
      return
    }

    try {
      // Capture face image from video
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      // Convert to data URL (for demo - in production, upload to server/Imgur)
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9)

      const relation = {
        id: `relation-${Date.now()}`,
        name: newRelationName,
        relationship: newRelationType,
        photo: imageUrl,
        messages: [],
        count: { value: 0 }
      }

      await addRelation(email, relation)
      setShowAddRelationModal(false)
      setNewRelationName('')
      setNewRelationType('')
      setSelectedFace(null)
      loadUser()
      setError('')
    } catch (err) {
      console.error('Error adding relation:', err)
      setError('Failed to add relation. Please try again.')
    }
  }

  // Handle canvas click to add new relation
  const handleCanvasClick = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find clicked face
    const clickedFace = detectedFaces.find(face => {
      const box = face.box
      return (
        x >= box.x && x <= box.x + box.width &&
        y >= box.y && y <= box.y + box.height
      )
    })

    if (clickedFace && !clickedFace.relation) {
      setSelectedFace(clickedFace)
      setShowAddRelationModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Face Recognition</h1>
          <p className="text-gray-400">
            Real-time face detection with relation identification
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading face recognition models...</p>
            <p className="text-xs text-gray-500 mt-2">
              Make sure models are in /public/models/ directory
            </p>
          </div>
        )}

        {!isLoading && (
          <div className="card">
            <div 
              ref={containerRef}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
              onClick={handleCanvasClick}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-auto"
                style={{ display: isDetecting ? 'block' : 'none' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-auto cursor-pointer"
                style={{ display: isDetecting ? 'block' : 'none' }}
              />
              
              {!isDetecting && (
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-6 text-lg">Camera not active</p>
                    <button 
                      onClick={startVideo} 
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <Video className="w-5 h-5" />
                      Start Camera
                    </button>
                  </div>
                </div>
              )}

              {isDetecting && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={stopVideo}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
                  >
                    <VideoOff className="w-4 h-4" />
                    Stop Camera
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Instructions:</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• <span className="text-green-400">Green boxes</span> = Known faces (shows name and relationship)</li>
                <li>• <span className="text-orange-400">Orange boxes</span> = Unknown faces (click to add as relation)</li>
                <li>• Overlays follow faces as they move in real-time</li>
                <li>• Make sure you have good lighting for best results</li>
              </ul>
            </div>
          </div>
        )}

        {/* Add Relation Modal */}
        {showAddRelationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-100">Add New Relation</h2>
                <button
                  onClick={() => {
                    setShowAddRelationModal(false)
                    setSelectedFace(null)
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newRelationName}
                    onChange={(e) => setNewRelationName(e.target.value)}
                    className="input-field"
                    placeholder="Enter name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Relationship
                  </label>
                  <select
                    value={newRelationType}
                    onChange={(e) => setNewRelationType(e.target.value)}
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

                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddRelationModal(false)
                      setSelectedFace(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRelation}
                    className="btn-primary flex-1"
                  >
                    Add Relation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceRecognition
