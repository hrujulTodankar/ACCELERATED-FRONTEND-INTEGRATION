import Dashboard from './components/Dashboard'
import { ModerationProvider } from './store/moderationStore'
import DarkVeil from './components/DarkVeil'
import ErrorBoundary from './components/ErrorBoundary'

import ToastContainer from './components/Toast'
import './App.css'

function App() {
  return (
    <ModerationProvider>
      <div className="relative min-h-screen overflow-hidden">

        {/* DarkVeil background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <ErrorBoundary fallback={({ error }) => (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 opacity-80"></div>
          )}>
            <DarkVeil
              hueShift={36}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={3}
              scanlineFrequency={1}
              warpAmount={1}
              resolutionScale={1}
            />
          </ErrorBoundary>
        </div>

        {/* App content */}
        <div className="relative z-10">
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
          <ToastContainer />
        </div>

      </div>
    </ModerationProvider>
  )
}

export default App
