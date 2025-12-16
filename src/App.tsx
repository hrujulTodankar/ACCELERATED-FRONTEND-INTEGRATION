import React, { useEffect } from 'react'
import Dashboard from './components/Dashboard'
import { ModerationProvider } from './store/moderationStore'
import ColorBends from './ColorBends'
// @ts-ignore
import DarkVeil from './components/DarkVeil'
import FloatingLines from './components/FloatingLines'
import './App.css'

function App() {
  useEffect(() => {
    // Add effects test function to window for easy testing
    (window as any).testEffects = () => {
      console.log('🧪 Testing Effects...');
      
      // Test 1: Check if DarkVeil canvas exists
      const darkveilCanvas = document.querySelector('.darkveil-canvas') as HTMLCanvasElement;
      console.log('✅ DarkVeil Canvas:', darkveilCanvas ? 'FOUND' : 'NOT FOUND');
      if (darkveilCanvas) {
        console.log('Canvas dimensions:', darkveilCanvas.width, 'x', darkveilCanvas.height);
        console.log('Canvas style:', window.getComputedStyle(darkveilCanvas));
      }
      
      // Test 2: Check WebGL support
      function checkWebGLSupport() {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        } catch (e) {
          return false;
        }
      }
      console.log('✅ WebGL Support:', checkWebGLSupport() ? 'YES' : 'NO');
      
      // Test 3: Check CSS animations
      function checkCSSAnimations() {
        const testElement = document.createElement('div');
        testElement.style.animation = 'colorBendsAnimation 1s';
        document.body.appendChild(testElement);
        const computedStyle = window.getComputedStyle(testElement);
        const animationDuration = computedStyle.animationDuration;
        document.body.removeChild(testElement);
        return animationDuration !== 'none';
      }
      console.log('✅ CSS Animations:', checkCSSAnimations() ? 'SUPPORTED' : 'NOT SUPPORTED');
      
      // Test 4: Check transition support
      function checkTransitions() {
        const testElement = document.createElement('div');
        testElement.style.transition = 'all 1s';
        document.body.appendChild(testElement);
        const computedStyle = window.getComputedStyle(testElement);
        const transitionProperty = computedStyle.transitionProperty;
        document.body.removeChild(testElement);
        return transitionProperty !== 'none';
      }
      console.log('✅ CSS Transitions:', checkTransitions() ? 'SUPPORTED' : 'NOT SUPPORTED');
      
      // Test 5: Check if effects containers exist
      const effectsContainers = document.querySelectorAll('[style*="z-index"], [class*="z-"]');
      console.log('🎯 Found', effectsContainers.length, 'effect containers');
      
      // Test 6: Check ColorBends elements
      const colorBendsElements = document.querySelectorAll('[class*="fixed"], [class*="absolute"]');
      console.log('🎯 Found', colorBendsElements.length, 'positioned elements');
      
      console.log('🎯 Effects Test Complete! Run testEffects() in console to test.');
    };
    
    // Auto-run test after 3 seconds to ensure components are mounted
    const timer = setTimeout(() => {
      console.log('🎯 Auto-running effects test...');
      (window as any).testEffects();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ModerationProvider>
      <div className="min-h-screen bg-slate-900 relative overflow-hidden">
        {/* DarkVeil Background - Blue WebGL shader effects (BEHIND EVERYTHING) */}
        <div className="fixed inset-0" style={{ zIndex: -20 }}>
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
        
        {/* FloatingLines - Interactive animated lines (BETWEEN DARKVEIL AND COLORBENDS) */}
        <div className="fixed inset-0" style={{ zIndex: -18 }}>
          <FloatingLines
            linesGradient={["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"]}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[8, 12, 6]}
            lineDistance={[8, 12, 10]}
            topWavePosition={{ x: 8.0, y: 0.8, rotate: -0.3 }}
            middleWavePosition={{ x: 4.0, y: 0.0, rotate: 0.1 }}
            bottomWavePosition={{ x: 2.0, y: -0.8, rotate: 0.2 }}
            animationSpeed={0.8}
            interactive={true}
            bendRadius={8.0}
            bendStrength={-0.3}
            parallax={true}
            parallaxStrength={0.15}
            mixBlendMode="screen"
          />
        </div>
        
        {/* ColorBends Background - Warm gradient colors (ABOVE FLOATINGLINES) */}
        <ColorBends
          colors={["#ff6b35", "#f7931e", "#ffd23f"]}
          rotation={45}
          speed={0.2}
          scale={1.0}
          frequency={1.2}
          warpStrength={0.8}
          mouseInfluence={0.6}
          parallax={0.4}
          noise={0.05}
          transparent
          className="absolute inset-0 z-[-15]"
        />
        
        {/* Test elements to verify z-index stacking */}
        <div
          className="fixed top-4 left-4 p-4 bg-red-500 text-white rounded z-[-5]"
          style={{ zIndex: -5 }}
        >
          🔴 Test: This should be behind content but visible
        </div>
        
        <div
          className="fixed top-4 right-4 p-4 bg-green-500 text-white rounded z-[5]"
          style={{ zIndex: 5 }}
        >
          🟢 Test: This should be above content
        </div>
        
        {/* Dashboard content above all background effects */}
        <div className="relative z-10">
          <Dashboard />
        </div>
      </div>
    </ModerationProvider>
  )
}

export default App
