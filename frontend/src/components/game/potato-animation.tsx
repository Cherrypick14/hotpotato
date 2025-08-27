"use client"

import { useEffect, useState } from "react"

export function PotatoAnimation({ isActive }: { isActive: boolean }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      // Random movement
      setPosition({
        x: Math.random() * 20 - 10, // -10 to 10 pixels
        y: Math.random() * 20 - 10
      })
      
      // Random rotation
      setRotation(prev => prev + (Math.random() * 20 - 10))
    }, 100)

    return () => clearInterval(interval)
  }, [isActive])

  return (
    <div 
      className="text-4xl transition-all duration-100 ease-linear"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.7))' : 'none'
      }}
    >
      🥔
    </div>
  )
}