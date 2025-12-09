import React from 'react'
import Dashboard from './components/Dashboard'
import { ModerationProvider } from './store/moderationStore'
import './App.css'

function App() {
  return (
    <ModerationProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </ModerationProvider>
  )
}

export default App