import { createContext, useContext, useState, useEffect } from 'react'
import { getUser } from '../services/api'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('userEmail') || ''
  })

  useEffect(() => {
    if (email) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [email])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userData = await getUser(email)
      setUser(userData)
    } catch (error) {
      console.error('Failed to load user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const setUserEmail = (newEmail) => {
    setEmail(newEmail)
    localStorage.setItem('userEmail', newEmail)
    if (newEmail) {
      loadUser()
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, email, setUserEmail, loadUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

