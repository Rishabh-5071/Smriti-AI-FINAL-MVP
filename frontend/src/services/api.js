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

export default api

