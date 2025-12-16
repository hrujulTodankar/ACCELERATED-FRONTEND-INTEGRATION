import React, { useEffect, useState } from 'react';

interface ColorBendsProps {
  colors?: string[];
  rotation?: number;
  speed?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  transparent?: boolean;
  className?: string;
}

const ColorBends: React.FC<ColorBendsProps> = ({
  colors = ["#ff5c7a", "#8a5cff", "#00ffd1"],
  rotation = 30,
  speed = 0.3,
  scale = 1.2,
  frequency = 1.4,
  warpStrength = 1.2,
  mouseInfluence = 0.8,
  parallax = 0.6,
  noise = 0.08,
  transparent = false,
  className = "",
}) => {
  const [cssSupported, setCssSupported] = useState(true);

  // Check CSS animation support
  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.style.animation = 'colorBendsAnimation 1s';
    document.body.appendChild(testElement);
    const computedStyle = window.getComputedStyle(testElement);
    const animationDuration = computedStyle.animationDuration;
    document.body.removeChild(testElement);
    
    if (animationDuration === 'none') {
      console.warn('CSS animations not supported, ColorBends effects disabled');
      setCssSupported(false);
    }
  }, []);

  // Create CSS animation keyframes based on the colors
  const gradientStyle = {
    background: `
      radial-gradient(circle at 20% 80%, ${colors[0]}40 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${colors[1]}40 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${colors[2]}40 0%, transparent 50%),
      linear-gradient(45deg, ${colors[0]}20, ${colors[1]}20, ${colors[2]}20)
    `,
    backgroundSize: '400% 400%, 400% 400%, 400% 400%, 200% 200%',
    animation: cssSupported ? `colorBendsAnimation ${10 / speed}s ease-in-out infinite` : 'none',
    transform: `rotate(${rotation}deg) scale(${scale})`,
  };

  const mouseFollowStyle = {
    background: `
      radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(255, 255, 255, 0.1) 0%, transparent 50%)
    `,
    transition: 'background 0.3s ease',
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Add CSS animations to the document
  useEffect(() => {
    if (!cssSupported) return;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes colorBendsAnimation {
        0% { background-position: 0% 50%, 100% 50%, 50% 0%, 0% 0%; }
        25% { background-position: 100% 50%, 0% 50%, 50% 100%, 100% 0%; }
        50% { background-position: 50% 100%, 50% 0%, 100% 50%, 0% 100%; }
        75% { background-position: 50% 0%, 50% 100%, 0% 50%, 100% 100%; }
        100% { background-position: 0% 50%, 100% 50%, 50% 0%, 0% 0%; }
      }
      
      @keyframes orbFloat {
        0% { transform: translateY(0px) rotate(${rotation}deg) scale(1); }
        100% { transform: translateY(-50px) rotate(${rotation}deg) scale(1.2); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [cssSupported, rotation]);

  // Fallback: simple static gradient background if CSS not supported
  const fallbackStyle = {
    background: `
      radial-gradient(circle at 20% 80%, ${colors[0]}40 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${colors[1]}40 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${colors[2]}40 0%, transparent 50%),
      linear-gradient(45deg, ${colors[0]}20, ${colors[1]}20, ${colors[2]}20)
    `,
    zIndex: -15,
  };

  return (
    <>
      {/* Main Background Layer */}
      <div
        className={`fixed inset-0 ${className}`}
        style={{
          ...(cssSupported ? gradientStyle : fallbackStyle),
          zIndex: cssSupported ? -15 : -15,
        }}
      />
      
      {/* Mouse Follow Effect Layer */}
      {cssSupported && (
        <div
          className={`fixed inset-0 ${className}`}
          style={{
            ...mouseFollowStyle,
            zIndex: -14,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Additional Animated Orbs */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -13,
        }}
      >
        {colors.map((color, index) => (
          <div
            key={index}
            className="absolute rounded-full opacity-70"
            style={{
              width: '250px',
              height: '250px',
              background: `radial-gradient(circle, ${color}70 0%, transparent 70%)`,
              top: `${15 + index * 25}%`,
              left: `${5 + index * 30}%`,
              animation: cssSupported ? `orbFloat ${6 + index * 1.5}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${index * 0.3}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default ColorBends;