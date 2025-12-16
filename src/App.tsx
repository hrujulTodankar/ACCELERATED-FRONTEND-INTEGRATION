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
            hueShift={200}
            noiseIntensity={0.05}
            scanlineIntensity={0.01}
            speed={0.15}
            scanlineFrequency={1}
            warpAmount={0.03}
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
