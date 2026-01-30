import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import Relations from './pages/Relations'
import Reminders from './pages/Reminders'
import Conversations from './pages/Conversations'
import FaceRecognition from './pages/FaceRecognition'
import Layout from './components/Layout'
import { UserProvider } from './context/UserContext'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile-setup" element={<ProfileSetup />} />
            <Route path="relations" element={<Relations />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="face-recognition" element={<FaceRecognition />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

