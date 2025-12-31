import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { ModerationProvider } from './store/moderationStore';
import { IntegrationProvider } from './store/integrationStore';
import DarkVeil from './components/DarkVeil';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/Toast';

// Import integration hooks
import { 
  useUnifiedAuth, 
  useIntegrationStatus, 
  useToast 
} from './hooks/useUnifiedIntegration';

import './App.css'

// Integration Status Indicator Component
const IntegrationStatusIndicator: React.FC = () => {
  const { status, services, isReady } = useIntegrationStatus();
  const { showToast } = useToast();

  useEffect(() => {
    if (status === 'ready') {
      showToast('Integration system initialized successfully', 'success', 3000);
    } else if (status === 'degraded') {
      showToast('Integration system running in degraded mode', 'warning', 5000);
    } else if (status === 'error') {
      showToast('Integration system encountered errors', 'error', 5000);
    }
  }, [status, showToast]);

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'initializing': return 'Initializing...';
      case 'ready': return 'Ready';
      case 'degraded': return 'Degraded';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3 border">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm font-medium text-gray-700">
          Integration: {getStatusText()}
        </span>
      </div>
      {services && Object.keys(services).length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Services: {Object.keys(services).length} active
        </div>
      )}
    </div>
  );
};

// Authentication Status Component
const AuthStatusIndicator: React.FC = () => {
  const { isAuthenticated, user, logout } = useUnifiedAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-3 border">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium text-gray-700">
          {user?.firstName} {user?.lastName}
        </span>
        <button
          onClick={logout}
          className="text-xs text-red-600 hover:text-red-800 ml-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <IntegrationProvider>
      <ModerationProvider>
        <div className="relative min-h-screen overflow-hidden">

          {/* Integration Status Indicators */}
          <IntegrationStatusIndicator />
          <AuthStatusIndicator />

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
    </IntegrationProvider>
  )
}

export default App
