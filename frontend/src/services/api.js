import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const createUser = async (userData) => {
  const response = await api.post('/create-user', userData)
  return response.data
}

export const getUser = async (email) => {
  const response = await api.get('/get-user', { params: { email } })
  return response.data
}

export const addRelation = async (email, relation) => {
  const response = await api.post('/add-relation', { email, relation })
  return response.data
}

export const addMessage = async (email, relationId, message) => {
  const response = await api.post('/message/add', { email, relation_id: relationId, message })
  return response.data
}

export const addReminder = async (email, time, message) => {
  const response = await api.post('/reminder/add', { email, time, message })
  return response.data
}

export const getReminders = async (email) => {
  const response = await api.get('/reminder/get', { params: { email } })
  return response.data
}

// ============== NEW API FUNCTIONS ==============

// Face Registration
export const registerFace = async (email, relationId, faceDescriptor) => {
  const response = await api.post('/register-face', {
    email,
    relation_id: relationId,
    face_descriptor: Array.from(faceDescriptor)
  })
  return response.data
}

export const getFaceDescriptors = async (email) => {
  const response = await api.get('/get-face-descriptors', { params: { email } })
  return response.data
}

// Conversation Management
export const addConversation = async (email, relationId, transcript, summary) => {
  const response = await api.post('/conversation/add', {
    email,
    relation_id: relationId,
    transcript,
    summary
  })
  return response.data
}

export const getLatestConversation = async (email, relationId) => {
  const response = await api.get('/conversation/latest', {
    params: { email, relation_id: relationId }
  })
  return response.data
}

export const getAllConversations = async (email, relationId = null) => {
  const params = { email }
  if (relationId) params.relation_id = relationId
  const response = await api.get('/conversations/all', { params })
  return response.data
}

// Delete Operations
export const deleteRelation = async (email, relationId) => {
  const response = await api.delete('/relation/delete', {
    data: { email, relation_id: relationId }
  })
  return response.data
}

export const deleteReminder = async (email, reminderId) => {
  const response = await api.delete('/reminder/delete', {
    data: { email, reminder_id: reminderId }
  })
  return response.data
}

// Relation Update
export const updateRelation = async (email, relationId, updates) => {
  const response = await api.post('/relation/update', {
    email,
    relation_id: relationId,
    updates
  })
  return response.data
}

export default api


