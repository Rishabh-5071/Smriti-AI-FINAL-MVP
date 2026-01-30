import { useEffect, useRef, useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import { addRelation, registerFace, getFaceDescriptors, addConversation } from '../services/api'
import { Camera, X, Video, VideoOff, Mic, MicOff, UserPlus, CheckCircle } from 'lucide-react'
import * as faceapi from 'face-api.js'

const FaceRecognition = () => {
  const { user, email, loadUser } = useUser()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState('')
  const [modelsLoaded, setModelsLoaded] = useState(false)

  // Face recognition state
  const [registeredDescriptors, setRegisteredDescriptors] = useState([])
  const [unregisteredRelations, setUnregisteredRelations] = useState([])
  const [detectedFaces, setDetectedFaces] = useState([])
  const [currentRecognizedFace, setCurrentRecognizedFace] = useState(null)

  // Modal states
  const [showAddRelationModal, setShowAddRelationModal] = useState(false)
  const [showRegisterFaceModal, setShowRegisterFaceModal] = useState(false)
  const [selectedFaceDescriptor, setSelectedFaceDescriptor] = useState(null)
  const [newRelationName, setNewRelationName] = useState('')
  const [newRelationType, setNewRelationType] = useState('')
  const [selectedRelationToRegister, setSelectedRelationToRegister] = useState('')

  // Continuous listening state
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const listeningStartTimeRef = useRef(null)

  const relationships = [
    'Spouse', 'Son', 'Daughter', 'Father', 'Mother',
    'Brother', 'Sister', 'Friend', 'Caregiver', 'Doctor', 'Nurse', 'Other'
  ]

  const FACE_MATCH_THRESHOLD = 0.6 // Lower = stricter matching

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
      } catch (err) {
        console.error('Error loading models:', err)
        setError('Failed to load face recognition models. Make sure models are in /public/models/')
        setIsLoading(false)
      }
    }
    loadModels()
  }, [])

  // Load registered face descriptors from backend
  const loadFaceDescriptors = useCallback(async () => {
    if (!email) return

    try {
      const data = await getFaceDescriptors(email)
      setRegisteredDescriptors(data.descriptors || [])
      setUnregisteredRelations(data.unregistered || [])
    } catch (err) {
      console.error('Error loading face descriptors:', err)
    }
  }, [email])

  useEffect(() => {
    if (email && modelsLoaded) {
      loadFaceDescriptors()
    }
  }, [email, modelsLoaded, loadFaceDescriptors])

  // Calculate Euclidean distance between two face descriptors
  const euclideanDistance = (a, b) => {
    if (!a || !b || a.length !== b.length) return Infinity
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
  }

  // Match detected face with registered descriptors
  const matchFaceWithDescriptors = (detectedDescriptor) => {
    if (!detectedDescriptor || registeredDescriptors.length === 0) return null

    let bestMatch = null
    let minDistance = Infinity

    for (const registered of registeredDescriptors) {
      const distance = euclideanDistance(
        Array.from(detectedDescriptor),
        registered.faceDescriptor
      )
      if (distance < minDistance && distance < FACE_MATCH_THRESHOLD) {
        minDistance = distance
        bestMatch = { ...registered, matchDistance: distance }
      }
    }

    return bestMatch
  }

  // Start video stream
  const startVideo = async () => {
    try {
      if (!email) {
        setError('Please set up your profile first')
        return
      }

      await loadFaceDescriptors() // Refresh descriptors before starting

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
    setCurrentRecognizedFace(null)
    stopListening()
  }

  // Start continuous listening
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (isListening && recognitionRef.current) {
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    listeningStartTimeRef.current = Date.now()
    setIsListening(true)
    setTranscript('')
  }, [isListening])

  // Stop listening and save conversation
  const stopListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Save conversation if we have transcript and a recognized face
    if (transcript && currentRecognizedFace && email) {
      try {
        // Generate summary (simplified - in production use Gemini API)
        const summary = transcript.length > 100
          ? transcript.substring(0, 97) + '...'
          : transcript || 'Brief conversation'

        await addConversation(email, currentRecognizedFace.id, transcript, summary)
        await loadFaceDescriptors() // Refresh to get updated lastSummary
        console.log('Conversation saved:', summary)
      } catch (err) {
        console.error('Error saving conversation:', err)
      }
    }

    setIsListening(false)
    setTranscript('')
    listeningStartTimeRef.current = null
  }, [transcript, currentRecognizedFace, email, loadFaceDescriptors])

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else if (currentRecognizedFace) {
      startListening()
    }
  }

  // Detect faces and draw overlays
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !isDetecting) return

    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    const canvas = canvasRef.current
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    canvas.width = videoWidth
    canvas.height = videoHeight

    const displaySize = { width: videoWidth, height: videoHeight }
    faceapi.matchDimensions(canvas, displaySize)

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceDescriptors()

    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const faces = []
    for (const detection of resizedDetections) {
      const box = detection.detection.box
      const descriptor = detection.descriptor

      // Try to match with registered faces
      const matchedRelation = matchFaceWithDescriptors(descriptor)

      const face = {
        id: `face-${Date.now()}-${Math.random()}`,
        box: box,
        descriptor: descriptor,
        matchedRelation: matchedRelation,
        isRegistered: !!matchedRelation,
        isUnknown: !matchedRelation
      }
      faces.push(face)

      // Draw appropriate overlay
      if (matchedRelation) {
        drawRecognizedFaceOverlay(ctx, box, matchedRelation)
        setCurrentRecognizedFace(matchedRelation)

        // Auto-start listening when face is recognized
        if (!isListening && !recognitionRef.current) {
          startListening()
        }
      } else {
        drawUnknownFaceOverlay(ctx, box)

        // Stop listening if no recognized face
        if (isListening) {
          stopListening()
        }
        setCurrentRecognizedFace(null)
      }
    }

    // If no faces detected, stop listening
    if (faces.length === 0 && isListening) {
      stopListening()
      setCurrentRecognizedFace(null)
    }

    setDetectedFaces(faces)
  }

  // Draw overlay for recognized face (GREEN)
  const drawRecognizedFaceOverlay = (ctx, box, relation) => {
    const padding = 12
    const labelHeight = 90
    const boxWidth = Math.max(box.width, 280)

    // Semi-transparent green background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'
    ctx.beginPath()
    ctx.roundRect(box.x, box.y - labelHeight - 10, boxWidth, labelHeight, 8)
    ctx.fill()

    // Border
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.stroke()

    // Name text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px Arial'
    ctx.fillText(
      relation.name || 'Unknown',
      box.x + padding,
      box.y - labelHeight + 28
    )

    // Relationship text
    ctx.font = '16px Arial'
    ctx.fillText(
      `Your ${relation.relationship}`,
      box.x + padding,
      box.y - labelHeight + 50
    )

    // Last conversation summary
    ctx.font = 'italic 13px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    const summary = relation.lastSummary || 'First time meeting'
    const truncatedSummary = summary.length > 40 ? summary.substring(0, 37) + '...' : summary
    ctx.fillText(
      `Last: ${truncatedSummary}`,
      box.x + padding,
      box.y - labelHeight + 75
    )

    // Face detection box
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(box.x, box.y, box.width, box.height, 8)
    ctx.stroke()

    // Recording indicator
    if (isListening) {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(box.x + boxWidth - 20, box.y - labelHeight + 20, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw overlay for unknown face (ORANGE)
  const drawUnknownFaceOverlay = (ctx, box) => {
    const padding = 12
    const labelHeight = 60
    const boxWidth = Math.max(box.width, 260)

    // Semi-transparent orange background
    ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'
    ctx.beginPath()
    ctx.roundRect(box.x, box.y - labelHeight - 10, boxWidth, labelHeight, 8)
    ctx.fill()

    // Border
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.stroke()

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Arial'
    ctx.fillText(
      'Unknown Person',
      box.x + padding,
      box.y - labelHeight + 25
    )

    ctx.font = '14px Arial'
    ctx.fillText(
      'Click to add as new relation',
      box.x + padding,
      box.y - labelHeight + 48
    )

    // Face detection box
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(box.x, box.y, box.width, box.height, 8)
    ctx.stroke()
  }

  // Detection loop
  useEffect(() => {
    if (!isDetecting || !modelsLoaded) return

    const interval = setInterval(() => {
      detectFaces()
    }, 200) // Detect every 200ms

    return () => clearInterval(interval)
  }, [isDetecting, modelsLoaded, registeredDescriptors, isListening])

  // Handle canvas click
  const handleCanvasClick = (e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = videoRef.current?.videoWidth / rect.width || 1
    const scaleY = videoRef.current?.videoHeight / rect.height || 1
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Find clicked face
    const clickedFace = detectedFaces.find(face => {
      const box = face.box
      return (
        x >= box.x && x <= box.x + box.width &&
        y >= box.y && y <= box.y + box.height
      )
    })

    if (clickedFace && !clickedFace.isRegistered) {
      setSelectedFaceDescriptor(Array.from(clickedFace.descriptor))

      // Check if user has unregistered relations
      if (unregisteredRelations.length > 0) {
        setShowRegisterFaceModal(true)
      } else {
        setShowAddRelationModal(true)
      }
    }
  }

  // Handle adding new relation with face
  const handleAddRelation = async () => {
    if (!email || !newRelationName || !newRelationType) {
      setError('Please fill in all fields')
      return
    }

    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9)

      const relationId = `relation-${Date.now()}`
      const relation = {
        id: relationId,
        name: newRelationName,
        relationship: newRelationType,
        photo: imageUrl,
        messages: [],
        count: { value: 0 },
        isRegistered: true,
        faceDescriptor: selectedFaceDescriptor
      }

      await addRelation(email, relation)

      // Also register the face separately
      if (selectedFaceDescriptor) {
        await registerFace(email, relationId, selectedFaceDescriptor)
      }

      setShowAddRelationModal(false)
      setNewRelationName('')
      setNewRelationType('')
      setSelectedFaceDescriptor(null)
      loadUser()
      await loadFaceDescriptors()
      setError('')
    } catch (err) {
      console.error('Error adding relation:', err)
      setError('Failed to add relation. Please try again.')
    }
  }

  // Handle registering face for existing relation
  const handleRegisterFaceToExisting = async () => {
    if (!selectedRelationToRegister || !selectedFaceDescriptor) {
      setError('Please select a relation')
      return
    }

    try {
      await registerFace(email, selectedRelationToRegister, selectedFaceDescriptor)
      setShowRegisterFaceModal(false)
      setSelectedRelationToRegister('')
      setSelectedFaceDescriptor(null)
      loadUser()
      await loadFaceDescriptors()
      setError('')
    } catch (err) {
      console.error('Error registering face:', err)
      setError('Failed to register face. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Face Recognition</h1>
          <p className="text-gray-400">
            Real-time face detection with intelligent relation identification
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-gray-400">Registered ({registeredDescriptors.length})</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span className="text-gray-400">Unknown Faces</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-gray-400">Unregistered Relations ({unregisteredRelations.length})</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading face recognition models...</p>
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
                    <button onClick={startVideo} className="btn-primary flex items-center gap-2 mx-auto">
                      <Video className="w-5 h-5" />
                      Start Camera
                    </button>
                  </div>
                </div>
              )}

              {isDetecting && (
                <>
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                      onClick={toggleListening}
                      className={`${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg`}
                      disabled={!currentRecognizedFace}
                      title={!currentRecognizedFace ? 'Recognize a face first' : ''}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isListening ? 'Stop Recording' : 'Record'}
                    </button>
                    <button
                      onClick={stopVideo}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
                    >
                      <VideoOff className="w-4 h-4" />
                      Stop
                    </button>
                  </div>

                  {/* Current recognition info */}
                  {currentRecognizedFace && (
                    <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 p-4 rounded-lg z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="text-white font-medium">
                              Recognized: {currentRecognizedFace.name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {currentRecognizedFace.relationship} • {currentRecognizedFace.count?.value || 0} interactions
                            </p>
                          </div>
                        </div>
                        {isListening && (
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-red-400 text-sm">Recording...</span>
                          </div>
                        )}
                      </div>
                      {transcript && (
                        <div className="mt-3 p-2 bg-gray-800 rounded text-gray-300 text-sm max-h-24 overflow-y-auto">
                          {transcript}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">How it works:</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• <span className="text-green-400">Green boxes</span> = Registered & recognized faces (shows name, relationship, last conversation)</li>
                <li>• <span className="text-orange-400">Orange boxes</span> = Unknown faces (click to add as new relation)</li>
                <li>• Recording starts automatically when a known face is detected</li>
                <li>• Conversations are saved and summarized when the person leaves the frame</li>
              </ul>
            </div>

            {/* Unregistered relations notice */}
            {unregisteredRelations.length > 0 && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <h3 className="text-sm font-medium text-blue-300 mb-2">
                  {unregisteredRelations.length} relation(s) need face registration:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {unregisteredRelations.map((rel) => (
                    <span key={rel.id} className="px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-sm">
                      {rel.name} ({rel.relationship})
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-400 mt-2">
                  Point the camera at them and click on their face to register
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add New Relation Modal */}
        {showAddRelationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-400" />
                  <h2 className="text-xl font-bold text-gray-100">Add New Relation</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddRelationModal(false)
                    setSelectedFaceDescriptor(null)
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                The face has been captured. Enter their details below.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Relationship</label>
                  <select
                    value={newRelationType}
                    onChange={(e) => setNewRelationType(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select relationship</option>
                    {relationships.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddRelationModal(false)
                      setSelectedFaceDescriptor(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddRelation} className="btn-primary flex-1">
                    Add & Register Face
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Register Face to Existing Relation Modal */}
        {showRegisterFaceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-100">Register Face</h2>
                <button
                  onClick={() => {
                    setShowRegisterFaceModal(false)
                    setSelectedFaceDescriptor(null)
                    setSelectedRelationToRegister('')
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Register this face to an existing relation, or add as a new person.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Existing Relation
                  </label>
                  <select
                    value={selectedRelationToRegister}
                    onChange={(e) => setSelectedRelationToRegister(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Choose a relation...</option>
                    {unregisteredRelations.map((rel) => (
                      <option key={rel.id} value={rel.id}>
                        {rel.name} ({rel.relationship})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRegisterFaceModal(false)
                      setShowAddRelationModal(true)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Add New Person
                  </button>
                  <button
                    onClick={handleRegisterFaceToExisting}
                    disabled={!selectedRelationToRegister}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Register Face
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
