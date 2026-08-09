import { useState, useRef, useCallback } from "react"

export function use3dTilt(maxTilt = 6) {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
  })
  
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)",
    transition: "opacity 0.5s ease"
  })

  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const el = cardRef.current
    const rect = el.getBoundingClientRect()
    
    // Relative mouse position from the center of the element (-1 to 1)
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    
    // Rotation calculations
    const rotateX = -y * maxTilt
    const rotateY = x * maxTilt
    
    // Glare position coordinates in percentage
    const glareX = ((e.clientX - rect.left) / rect.width) * 100
    const glareY = ((e.clientY - rect.top) / rect.height) * 100
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: "transform 0.05s ease-out",
      transformStyle: "preserve-3d"
    })
    
    setGlareStyle({
      opacity: 0.12,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
      transition: "opacity 0.1s ease-out"
    })
  }, [maxTilt])

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
    })
    
    setGlareStyle({
      opacity: 0,
      background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)",
      transition: "opacity 0.5s ease"
    })
  }, [])

  return {
    cardRef,
    tiltStyle,
    glareStyle,
    handleMouseMove,
    handleMouseLeave
  }
}
