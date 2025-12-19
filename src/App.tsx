import Dashboard from './components/Dashboard'
import { ModerationProvider } from './store/moderationStore'
// @ts-ignore
import DarkVeil from './components/DarkVeil'
import './App.css'

function App() {
  return (
    <ModerationProvider>
      <div className="relative min-h-screen overflow-hidden">

        {/* DarkVeil background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <DarkVeil
            hueShift={36}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={3}
            scanlineFrequency={1}
            warpAmount={1}
            resolutionScale={1}
          />
        </div>

        {/* App content */}
        <div className="relative z-10">
          <Dashboard />
        </div>

      </div>
    </ModerationProvider>
  )
}

export default App
