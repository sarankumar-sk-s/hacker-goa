import { useImperativeHandle, forwardRef, useState, useRef, useEffect } from "react"
import { MapPin } from "lucide-react"
import type { GeneratorFormValues } from "../../../types"
import { use3dTilt } from "../../../hooks/use3dTilt"

interface BuilderCardPreviewProps {
  values: GeneratorFormValues
  imageSrc: string | null
  zoom: number
  onZoomChange?: (zoom: number) => void
  position: { x: number; y: number }
  onPositionChange?: (pos: { x: number; y: number }) => void
  builderId?: string
  isProcessing?: boolean
  logs?: string[]
}

export interface BuilderCardPreviewRef {
  download: () => Promise<void>
}

// Inline SVGs for social icons to guarantee rendering without Lucide import mismatches
const GithubIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="h-3.5 w-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

export const BuilderCardPreview = forwardRef<BuilderCardPreviewRef, BuilderCardPreviewProps>(
  ({ values, imageSrc, zoom, onZoomChange, position, onPositionChange, builderId, isProcessing = false, logs = [] }, ref) => {
    // 3D tilt controls
    const { cardRef, tiltStyle, glareStyle, handleMouseMove, handleMouseLeave } = use3dTilt(7)

    const parentRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
      const parent = parentRef.current
      if (!parent) return

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const parentWidth = entry.contentRect.width
          const newScale = Math.min(1, parentWidth / 300)
          setScale(newScale)
        }
      })

      observer.observe(parent)
      return () => observer.disconnect()
    }, [])

    // Baseline size of card preview is 300px width for Goa Heritage
    const cardWidth = 300
    const avatarHalfSize = 78

    // Clamp coordinates to keep photo within circular frame boundary
    const clampPosition = (x: number, y: number, currentZoom: number) => {
      const maxT = Math.max(0, avatarHalfSize * (currentZoom - 1.0))
      return {
        x: Math.max(-maxT, Math.min(maxT, x)),
        y: Math.max(-maxT, Math.min(maxT, y))
      }
    }

    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll wheel zoom handler
    const handleWheel = (e: React.WheelEvent) => {
      if (values.frameStyle !== "goa-classic" && values.frameStyle !== "goa-builder") return
      e.preventDefault()
      const zoomFactor = 0.08
      const direction = e.deltaY < 0 ? 1 : -1
      const nextZoom = Math.max(1.0, Math.min(4.0, zoom + direction * zoomFactor))
      onZoomChange?.(nextZoom)
      onPositionChange?.(clampPosition(position.x, position.y, nextZoom))
    }

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      if (values.frameStyle !== "goa-classic" && values.frameStyle !== "goa-builder") return
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }

    const handleMouseMoveImg = (e: React.MouseEvent) => {
      if (!isDragging) return
      const rawX = e.clientX - dragStartRef.current.x
      const rawY = e.clientY - dragStartRef.current.y
      onPositionChange?.(clampPosition(rawX, rawY, zoom))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // Mobile touch drag handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      if (values.frameStyle !== "goa-classic" && values.frameStyle !== "goa-builder") return
      if (e.touches.length === 1) {
        setIsDragging(true)
        const touch = e.touches[0]
        dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y }
      }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const rawX = touch.clientX - dragStartRef.current.x
        const rawY = touch.clientY - dragStartRef.current.y
        onPositionChange?.(clampPosition(rawX, rawY, zoom))
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    // Accent color theme resolution for Frame 1
    const colorThemes = {
      "neon-green": {
        primary: "#39FF14",
        gradient: "from-green-500/20 via-zinc-950 to-zinc-950",
        border: "border-[#39FF14]/30 hover:border-[#39FF14]/60",
        badge: "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20",
        text: "text-[#39FF14]",
      },
      "cyber-cyan": {
        primary: "#00F0FF",
        gradient: "from-cyan-500/20 via-zinc-950 to-zinc-950",
        border: "border-cyan-500/30 hover:border-cyan-500/60",
        badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        text: "text-cyan-400",
      },
      "laser-purple": {
        primary: "#BD00FF",
        gradient: "from-purple-500/20 via-zinc-950 to-zinc-950",
        border: "border-purple-500/30 hover:border-purple-500/60",
        badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        text: "text-purple-400",
      },
      "sunset-orange": {
        primary: "#FF5C00",
        gradient: "from-orange-500/20 via-zinc-950 to-zinc-950",
        border: "border-orange-500/30 hover:border-orange-500/60",
        badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        text: "text-orange-400",
      },
    }

    const currentTheme = colorThemes[values.accentColor] || colorThemes["neon-green"]

    useImperativeHandle(ref, () => ({
      download: async () => {
        // Dynamically import to keep bundle small
        const { downloadBuilderCard } = await import("../../../lib/canvas")
        await downloadBuilderCard(
          imageSrc, 
          values, 
          currentTheme.primary,
          zoom,
          position,
          cardWidth,
          builderId
        )
      },
    }))

    // Render Template 3: Hacker House Goa Builder ID Card
    if (values.frameStyle === "goa-builder") {
      const activeRole = (values.role || "BUILDER").toUpperCase()
      const formattedId = builderId 
        ? `HHG-26-${builderId.split("-").pop() || "0000"}` 
        : "HHG-26-0000"

      return (
        <div 
          ref={parentRef} 
          className="w-full flex justify-center items-center overflow-visible py-4 select-none"
          style={{ height: 475 * scale }}
        >
          <div 
            style={{
              width: 300,
              height: 475,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
            className="relative flex flex-col items-center shrink-0"
          >
            {/* Top Black Clip Element */}
          <div className="w-[80px] h-[35px] relative z-20 -mb-2.5 flex flex-col items-center pointer-events-none select-none">
            {/* The metal clamp loop */}
            <div className="w-[45px] h-[10px] bg-zinc-700 rounded-md border border-zinc-800 shadow-sm flex items-center justify-center">
              <div className="w-[35px] h-[3px] bg-zinc-900 rounded-sm" />
            </div>
            {/* The strap loop hole */}
            <div className="w-[20px] h-[8px] bg-zinc-800 border-x border-zinc-900" />
            {/* The main physical connector hook */}
            <div className="w-[30px] h-[18px] bg-zinc-900 rounded-t-sm border border-zinc-950 shadow-md flex items-center justify-center relative">
              <div className="w-[8px] h-[8px] rounded-full bg-[#F7C32E] border border-amber-600" />
            </div>
          </div>

          {/* Card interactive 3D container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tiltStyle}
            className="w-[300px] aspect-[2/3] rounded-[24px] relative bg-[#F4EFE4] border-2 border-[#1E4D39] flex flex-col justify-between overflow-hidden cursor-default shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-300"
          >
            {/* Subtle paper noise overlay */}
            <div className="absolute inset-0 bg-repeat opacity-[0.03] pointer-events-none z-1" style={{ backgroundImage: "url('/paper_texture.png')" }} />
            
            {/* Top Text Spacing */}
            <div className="absolute top-[12px] left-[18px] right-[18px] flex justify-between text-[7.5px] font-heading font-black text-[#1E4D39] tracking-wider z-15 pointer-events-none uppercase">
              <span>28 – 31 OCT • GOA</span>
              <span>HH GOA • 2026</span>
            </div>

            {/* Title Section */}
            <div className="absolute top-[28px] left-[18px] right-[18px] flex flex-col items-start z-15 pointer-events-none text-left">
              <div className="flex items-center gap-1.5 w-full relative">
                <span className="text-[25px] font-heading font-black tracking-tight text-[#0F2A21] leading-none select-none">
                  HACKER HOUSE
                </span>
                
                {/* Goa badge beside title */}
                <div 
                  className="bg-[#F7C32E] border border-[#E53E3E] rounded-[6px] px-1.5 py-0.5 shadow-sm rotate-[-8deg] flex items-center justify-center translate-y-[-2px] ml-1 scale-95"
                >
                  <span className="text-[9px] text-[#E53E3E] font-heading font-black leading-none uppercase">
                    गोवा
                  </span>
                </div>
              </div>
              
              <span className="text-[6.5px] font-heading font-black tracking-[0.25em] text-[#1E4D39] mt-1 select-none">
                BUILD <span className="text-[#F7C32E]">•</span> BREAK <span className="text-[#E91E63]">•</span> INNOVATE
              </span>
            </div>

            {/* Vector Illustration Backdrop */}
            <svg viewBox="0 0 300 450" className="absolute inset-0 w-full h-full pointer-events-none z-5 select-none" fill="none">
              {/* Sun */}
              <circle cx="50" cy="245" r="22" fill="#F7C32E" opacity="0.9" />
              
              {/* Left ocean waves */}
              <path d="M -10 270 Q 15 264 40 270 T 110 268 L 110 290 L -10 290 Z" fill="#1E4D39" opacity="0.2" />
              <path d="M -10 274 Q 18 268 46 274 T 110 272 L 110 290 L -10 290 Z" fill="#1E4D39" opacity="0.35" />
              
              {/* Fort silhouette (Aguada Lighthouse & wall) */}
              <path d="M 15 272 L 15 258 L 22 258 L 22 254 L 18 254 L 18 248 L 24 248 L 24 272 Z" fill="#0F2A21" opacity="0.85" />
              <path d="M 5 275 Q 12 268 28 270 T 45 275 Z" fill="#0F2A21" />

              {/* Left Palm tree */}
              <path d="M 5 295 C 18 270 12 220 2 185" stroke="#1E4D39" stroke-width="2.5" stroke-linecap="round" />
              {/* Left palm leaves */}
              <path d="M 2 185 Q 15 178 25 182 Q 13 188 2 185" fill="#1E4D39" />
              <path d="M 2 185 Q -8 175 -18 180 Q -10 187 2 185" fill="#1E4D39" />
              <path d="M 2 185 Q 0 198 -3 208 Q 1 196 2 185" fill="#1E4D39" />
              <path d="M 2 185 Q 12 195 18 205 Q 10 193 2 185" fill="#1E4D39" />
              
              {/* Right foliage / palm tree */}
              <path d="M 295 295 C 285 275 288 240 295 210" stroke="#1E4D39" stroke-width="1.8" stroke-dasharray="1.5 1.5" opacity="0.4" />
              <path d="M 295 210 Q 285 204 275 208 Q 283 213 295 210" fill="#1E4D39" opacity="0.4" />
              <path d="M 295 210 Q 293 220 291 228 Q 294 218 295 210" fill="#1E4D39" opacity="0.4" />
            </svg>

            {/* Avatar Base Image - placed inside the circular cutout boundary */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMoveImg}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="absolute rounded-full overflow-hidden z-0 bg-[#F9F4EB]"
              style={{
                width: "156.4px",
                height: "156.4px",
                left: "71.8px",
                top: "98.2px",
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="avatar"
                  className="w-full h-full object-cover origin-center pointer-events-none select-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transition: isDragging ? "none" : "transform 0.15s ease-out"
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#FAF7F2] flex flex-col items-center justify-center text-[#1E4D39]/50">
                  <div className="flex flex-col items-center justify-center mb-0.5">
                    <svg className="h-9 w-9 text-[#1E4D39]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <span className="text-[7.5px] uppercase font-bold tracking-widest font-heading text-[#1E4D39]/50">
                    YOUR PHOTO
                  </span>
                </div>
              )}
            </div>

            {/* Three colored rings around photo area */}
            <div 
              className="absolute rounded-full border-[2.5px] border-[#1E4D39] pointer-events-none z-10"
              style={{
                width: "163.4px",
                height: "163.4px",
                left: "68.3px",
                top: "94.7px",
              }}
            />
            <div 
              className="absolute rounded-full border-[2px] border-[#F7C32E] pointer-events-none z-10"
              style={{
                width: "159.4px",
                height: "159.4px",
                left: "70.3px",
                top: "96.7px",
              }}
            />
            <div 
              className="absolute rounded-full border-[1.5px] border-[#E53E3E] pointer-events-none z-10"
              style={{
                width: "156.4px",
                height: "156.4px",
                left: "71.8px",
                top: "98.2px",
              }}
            />

            {/* Side Icons Stack */}
            <div className="absolute right-[22px] top-[138px] flex flex-col items-center gap-5 text-[#1E4D39] z-15 pointer-events-none">
              <span className="font-heading font-black text-xs select-none">
                &lt;/&gt;
              </span>
              {/* Lightbulb outline SVG */}
              <svg className="h-4.5 w-4.5 text-[#1E4D39]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {/* Palm tree outline SVG */}
              <svg className="h-4.5 w-4.5 text-[#1E4D39]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V10m0 0a8 8 0 018-2c0 2-4 2-8 2m0 0a8 8 0 00-8-2c0 2 4 2 8 2m0 0a5 5 0 014-4m-4 4a5 5 0 00-4-4" />
              </svg>
            </div>

            {/* Brush Stroke Badge */}
            <div className="absolute left-[70px] top-[260px] w-[160px] h-[34px] flex items-center justify-center z-15 pointer-events-none">
              <svg viewBox="0 0 120 30" className="absolute inset-0 w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                <path d="M 5,12 C 30,14 65,10 95,12 C 105,13 115,11 118,13 C 110,17 90,21 75,20 C 50,22 25,19 8,17 C 2,16 -2,14 1,12 Z" fill="#0F2A21" />
              </svg>
              <span className="text-[10px] text-white font-heading font-black tracking-[0.2em] uppercase z-20 translate-y-[2px] pl-1.5">
                {activeRole}
              </span>
            </div>

            {/* Name & GitHub Section */}
            <div className="absolute left-[20px] right-[20px] top-[294px] flex flex-col items-center gap-0.5 z-15 pointer-events-none text-center">
              <span className="text-[12px] font-heading font-black tracking-wide text-[#0F2A21] uppercase leading-tight select-none">
                {values.name || "YOUR NAME"}
              </span>
              <span className="text-[8.5px] font-mono font-bold text-[#E53E3E] select-none">
                @{values.github || "username"}
              </span>
            </div>

            {/* Builder ID Section */}
            <div className="absolute left-[50px] top-[328px] w-[200px] flex flex-col items-center gap-0.5 z-15 pointer-events-none">
              <span className="text-[6px] font-heading font-black tracking-widest text-[#1E4D39] opacity-60">
                BUILDER ID
              </span>
              <span className="text-[10px] font-heading font-black tracking-wider text-[#0F2A21]">
                {formattedId}
              </span>
            </div>

            {/* Bottom green metadata strip */}
            <div className="absolute bottom-0 left-0 right-0 h-[105px] bg-[#0F2A21] flex flex-col z-15 select-none pointer-events-none">
              {/* Accent colored line */}
              <div className="w-full h-[2.5px] flex shrink-0">
                <div className="w-[40%] bg-[#1E4D39]" />
                <div className="w-[30%] bg-[#F7C32E]" />
                <div className="w-[30%] bg-[#E53E3E]" />
              </div>
              
              {/* Content row */}
              <div className="flex-grow flex items-center justify-between px-[18px]">
                {/* QR Code Container */}
                <div className="w-[50px] h-[50px] bg-white rounded-md p-1 flex items-center justify-center shrink-0">
                  <img 
                    src="/qr_hhgoa.png" 
                    alt="QR" 
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Metadata Column */}
                <div className="flex-grow pl-[14px] text-left flex flex-col gap-1.5 text-white/90">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3 w-3 text-[#F7C32E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[7.5px] font-heading font-black tracking-wider uppercase">
                      GOA, INDIA
                    </span>
                  </div>
                </div>

                {/* Right outline illustration */}
                <div className="shrink-0 flex items-center justify-end text-[#F4EFE4]/25 pr-1">
                  <svg className="h-14 w-14" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth={1}>
                    <path d="M 30 10 L 30 18 M 27 13 L 33 13 M 30 18 L 22 25 L 22 45 L 38 45 L 38 25 Z" />
                    <path d="M 26 30 L 34 30 M 30 27 L 30 35" />
                    <path d="M 45 45 C 47 38 45 32 40 28 M 40 28 Q 48 26 53 28 M 40 28 Q 42 34 44 40" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Interactive instructions HUD */}
            {imageSrc && !isDragging && (
              <div 
                className="absolute pointer-events-none flex items-center justify-center z-20 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  width: "156.4px",
                  height: "156.4px",
                  left: "71.8px",
                  top: "98.2px",
                }}
              >
                <div className="bg-black/80 backdrop-blur-[2px] px-2.5 py-1 rounded-md border border-white/10 text-center shadow-lg">
                  <span className="text-[8px] text-[#F7C32E] font-heading uppercase font-bold tracking-widest block">
                    Drag / Scroll Zoom
                  </span>
                </div>
              </div>
            )}

            {/* HUD processing terminal screen overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-sm z-30 flex flex-col justify-end p-6 font-mono text-left text-xs leading-relaxed border border-[#1E4D39]/30 rounded-[24px]">
                <div className="flex-1 flex flex-col justify-start overflow-y-auto space-y-2 scrollbar-none pt-2">
                  <div className="text-[#1E4D39] font-bold border-b border-[#1E4D39]/15 pb-2 mb-2 uppercase tracking-wider text-[10px] flex justify-between">
                    <span>[HHG-2026] Processing...</span>
                    <span className="animate-ping font-heading">●</span>
                  </div>
                  {logs.map((log, index) => (
                    <div key={index} className="text-[#1E4D39]/80 text-[10px] break-all">
                      {log}
                    </div>
                  ))}
                  <div className="text-[#1E4D39] animate-pulse flex items-center gap-1.5 mt-2">
                    <span>&gt;</span>
                    <span className="h-3.5 w-1.5 bg-[#1E4D39] inline-block" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )
    }

    // Render Template 2: Goa Heritage
    if (values.frameStyle === "goa-classic") {
      const activeRole = (values.role || "BUILDER").toUpperCase()
      return (
        <div 
          ref={parentRef} 
          className="w-full flex justify-center items-center overflow-visible py-4 select-none"
          style={{ height: 450 * scale }}
        >
          <div 
            style={{
              width: 300,
              height: 450,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
            className="relative flex flex-col items-center shrink-0"
          >
            {/* Card interactive 3D container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tiltStyle}
            className="w-[300px] aspect-[2/3] rounded-[24px] relative bg-[#FAF7F2] border-2 border-[#0B3F20] flex flex-col justify-between overflow-hidden cursor-default shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-300"
          >
            {/* Glare hologram overlay */}
            <div
              className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 rounded-[24px]"
              style={glareStyle}
            />

            {/* Avatar Base Image - placed inside the circular cutout boundary */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMoveImg}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="absolute rounded-full overflow-hidden z-0 bg-[#F9F4EB]"
              style={{
                width: "156.4px",
                height: "156.4px",
                left: "71.8px",
                top: "98.2px",
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="avatar"
                  className="w-full h-full object-cover origin-center pointer-events-none select-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transition: isDragging ? "none" : "transform 0.15s ease-out"
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#F9F4EB] flex flex-col items-center justify-center text-[#0B3F20]/50">
                  <div className="flex flex-col items-center justify-center mb-0.5">
                    <svg className="h-10 w-10 text-[#0B3F20]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <span className="text-[7.5px] uppercase font-bold tracking-widest font-heading text-[#0B3F20]/50">
                    YOUR PHOTO
                  </span>
                </div>
              )}
            </div>

            {/* Interactive instruction HUD for drag/zoom */}
            {imageSrc && !isDragging && (
              <div 
                className="absolute pointer-events-none flex items-center justify-center z-15 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  width: "156.4px",
                  height: "156.4px",
                  left: "71.8px",
                  top: "98.2px",
                }}
              >
                <div className="bg-black/75 backdrop-blur-[1px] px-2.5 py-1 rounded border border-white/10 text-center shadow-md">
                  <span className="text-[7.5px] text-white font-heading uppercase font-bold tracking-wider block">
                    Drag / Scroll Zoom
                  </span>
                </div>
              </div>
            )}

            {/* Background template overlay (rendered on top of photo, with exact 300x450 pixel mapping for mobile) */}
            <div
              className="absolute inset-0 bg-no-repeat pointer-events-none z-10 animate-fadeIn"
              style={{ 
                backgroundImage: `url('/goa_heritage_bg.png')`,
                backgroundSize: "300px 450px",
                backgroundPosition: "0 0"
              }}
            />

            {/* Dynamic Pink/Magenta Builder Badge (rotates -6deg, overlaps lower left of circle) */}
            <div 
              className="absolute left-[66px] top-[215px] w-[52px] h-[19px] bg-[#D92B5A] border border-[#0B3F20] rounded-[4px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.15)] z-15 pointer-events-none"
              style={{ transform: "rotate(-6deg)" }}
            >
              <span className="text-[7px] text-white font-heading font-black tracking-widest uppercase truncate px-1 leading-none">
                {activeRole}
              </span>
            </div>

            {/* 1. Dynamic Name inside yellow name box */}
            <div className="absolute left-[46px] top-[280px] w-[160px] h-[21px] flex items-center justify-center font-heading font-black text-[11px] text-[#0B3F20] tracking-wide uppercase truncate z-15 pointer-events-none leading-none whitespace-nowrap">
              {values.name || "YOUR NAME"}
            </div>

            {/* 2. Dynamic Username inside green pill */}
            <div className="absolute left-[211px] top-[283px] w-[43px] h-[14px] flex items-center justify-center font-sans font-bold text-[7px] text-[#FCD205] truncate z-15 pointer-events-none leading-none whitespace-nowrap">
              @{values.github || "username"}
            </div>

            {/* 3. Dynamic Stack column */}
            <div className="absolute left-[41px] top-[315px] w-[82px] h-[16px] font-sans font-semibold text-[8px] text-[#0B3F20] leading-none text-left truncate z-15 pointer-events-none whitespace-nowrap overflow-hidden">
              {values.techStack || "Your Stack"}
            </div>

            {/* 4. Dynamic Title (Designation) column */}
            <div className="absolute left-[158px] top-[315px] w-[94px] h-[16px] font-sans font-semibold text-[8px] text-[#0B3F20] leading-none text-left truncate z-15 pointer-events-none whitespace-nowrap overflow-hidden">
              {values.title || "Your Title"}
            </div>

            {/* 5. Dynamic Barcode Stripes */}
            <div className="absolute left-[77px] top-[344px] w-[147px] h-[26px] flex items-center justify-between opacity-85 pointer-events-none z-15">
              {Array.from({ length: 48 }).map((_, i) => {
                const hash = (builderId || "1947").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
                const width = (i + hash) % 5 === 0 ? "3px" : (i + hash) % 3 === 0 ? "1.2px" : "2.2px"
                return (
                  <div
                    key={i}
                    className="h-full bg-[#0B3F20]"
                    style={{ width }}
                  />
                )
              })}
            </div>

            {/* 6. Dynamic Builder ID text */}
            <div className="absolute left-[77px] top-[374px] w-[147px] h-[12px] text-center font-mono font-bold text-[7px] text-[#0B3F20] opacity-70 tracking-wider uppercase z-15 pointer-events-none leading-none whitespace-nowrap overflow-hidden">
              {builderId || "HHGOA26-BUILDER-1947"}
            </div>

            {/* 7. Aligned Coordinates text & QR Code inside Buttons */}
            {/* Cover for the left button rectangle box to remove it */}
            <div className="absolute left-[48px] top-[395px] w-[98px] h-[26px] bg-[#FAF7F2] z-12 pointer-events-none" />

            {/* First Button area (left) - now contains centered larger pink QR code without the outline box */}
            <div className="absolute left-[49px] top-[384px] w-[96px] h-[48px] z-15 pointer-events-none flex items-center justify-center">
              <img 
                src="/qr_hhgoa.png" 
                alt="QR" 
                className="w-[28px] h-[28px]"
              />
            </div>

            {/* Second Button (right) - contains centered coordinates text */}
            <div className="absolute left-[153.5px] top-[396px] w-[93px] h-[24px] z-15 pointer-events-none flex flex-col items-center justify-center text-center text-[#0B3F20]/80 leading-[1.2] uppercase font-sans font-black">
              <div className="text-[4.8px]">
                <span className="opacity-55 font-extrabold text-[4.4px]">VIEW :</span> 15.2993° N, 74.1240° E
              </div>
              <div className="opacity-95 text-[5px]">GOA, INDIA</div>
            </div>

            {/* HUD processing terminal screen overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-sm z-30 flex flex-col justify-end p-6 font-mono text-left text-xs leading-relaxed border border-[#0B3F20]/30 rounded-[24px]">
                <div className="flex-1 flex flex-col justify-start overflow-y-auto space-y-2 scrollbar-none pt-2">
                  <div className="text-[#0B3F20] font-bold border-b border-[#0B3F20]/15 pb-2 mb-2 uppercase tracking-wider text-[10px] flex justify-between">
                    <span>[HHG-2026] Processing...</span>
                    <span className="animate-ping font-heading">●</span>
                  </div>
                  {logs.map((log, index) => (
                    <div key={index} className="text-[#0B3F20]/80 text-[10px] break-all">
                      {log}
                    </div>
                  ))}
                  <div className="text-[#0B3F20] animate-pulse flex items-center gap-1.5 mt-2">
                    <span>&gt;</span>
                    <span className="h-3.5 w-1.5 bg-[#0B3F20] inline-block" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )
    }

    // Render Template 1: Cyberpunk
    return (
      <div className="w-full flex justify-center py-4 select-none">
        {/* Card interactive 3D container */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="w-full max-w-[310px] sm:max-w-[340px] md:max-w-[370px] aspect-[5/8] rounded-[24px] relative bg-zinc-950 border p-6 flex flex-col justify-between overflow-hidden cursor-default shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          {/* Glare hologram overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
            style={glareStyle}
          />

          {/* Background image & gradient overlay (WebP optimized) */}
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none animate-fadeIn"
            style={{ backgroundImage: `url('/goa_cyberpunk_badge_bg.webp')` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,5,7,0.95)_0%,rgba(5,5,7,0.7)_50%,rgba(5,5,7,0.4)_100%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#050507]/95 via-[#050507]/60 to-transparent pointer-events-none" />

          {/* Theme tint */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge transition-all duration-300"
            style={{ background: `radial-gradient(circle at 50% 30%, ${currentTheme.primary}4D, transparent 70%)` }}
          />

          <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />

          {/* Card Content Header */}
          <div className="flex justify-between items-start z-10">
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-heading font-black text-white/90">
                Hacker House Goa
              </h4>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-sans mt-0.5">
                Goa 2026 Edition
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold border ${currentTheme.badge} font-heading transition-all duration-300`}>
              BUILDER PASS
            </span>
          </div>

          {/* Profile Photo slot */}
          <div className="flex flex-col items-center justify-center my-4 z-10">
            <div className={`w-[190px] h-[190px] rounded-xl overflow-hidden border-2 border-dashed ${currentTheme.border} p-1 flex items-center justify-center bg-zinc-950/40 relative transition-all duration-300`}>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Avatar cropped pass"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500">
                  <div className="h-10 w-10 rounded-full border border-white/5 flex items-center justify-center bg-zinc-900/50 mb-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-widest font-heading">
                    Photo Slot
                  </span>
                </div>
              )}
              {/* Corner crosshairs */}
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-white/20" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/20" />
              <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-white/20" />
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/20" />
            </div>
          </div>

          {/* Builder Metadata */}
          <div className="text-center z-10 flex-grow flex flex-col justify-center">
            <h3 className="text-xl md:text-2xl font-black text-white font-heading truncate leading-tight tracking-tight">
              {values.name || "YOUR NAME"}
            </h3>
            <p className="text-xs text-zinc-350 font-sans mt-0.5 truncate font-medium">
              {values.title || "Builder & Hacker"}
            </p>
            
            <div className="flex justify-center mt-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest font-heading border ${currentTheme.badge} transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.4)]`}>
                {values.role || "BUILDER"}
              </span>
            </div>

            <p className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase mt-4 truncate font-bold">
              {values.techStack || "TypeScript, React, Rust"}
            </p>
          </div>

          {/* Footer Card Info */}
          <div className="border-t border-white/5 pt-4 mt-2 z-10">
            <div className="flex justify-between items-end">
              <div className="text-left space-y-1">
                {values.github && (
                  <div className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors">
                    <GithubIcon />
                    <span className="text-[10px] font-mono">@{values.github}</span>
                  </div>
                )}
                {values.twitter && (
                  <div className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors">
                    <TwitterIcon />
                    <span className="text-[10px] font-mono">@{values.twitter}</span>
                  </div>
                )}
                {!values.github && !values.twitter && (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                    <span className="text-[9px] font-mono">HH Goa coordinates</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-[9px] font-mono uppercase text-zinc-300 font-bold">GOA, INDIA</p>
                <p className="text-[8px] font-mono text-zinc-500 font-medium">15.2993° N, 74.1240° E</p>
              </div>
            </div>

            {/* Micro QR Barcode motif */}
            <div className="w-full flex items-center justify-between mt-3.5 opacity-25">
              <div className="h-3 flex flex-grow gap-[2px]">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full bg-white rounded-sm"
                    style={{ width: i % 4 === 0 ? "3px" : i % 3 === 0 ? "1px" : "2px" }}
                  />
                ))}
              </div>
              <span className="text-[7px] font-mono text-zinc-500 tracking-tighter shrink-0 ml-2">
                HHG-2026-VERIFIED
              </span>
            </div>
          </div>

          {/* HUD processing terminal screen overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-30 flex flex-col justify-end p-6 font-mono text-left text-xs leading-relaxed border border-neon-emerald/30 rounded-[24px]">
              <div className="flex-1 flex flex-col justify-start overflow-y-auto space-y-2 scrollbar-none pt-2">
                <div className="text-neon-emerald font-bold border-b border-neon-emerald/15 pb-2 mb-2 uppercase tracking-wider text-[10px] flex justify-between">
                  <span>[HHG-2026] Processing Matrix</span>
                  <span className="animate-ping font-heading">●</span>
                </div>
                {logs.map((log, index) => (
                  <div key={index} className="text-zinc-300 text-[10px] break-all">
                    {log}
                  </div>
                ))}
                <div className="text-neon-emerald animate-pulse flex items-center gap-1.5 mt-2">
                  <span>&gt;</span>
                  <span className="h-3.5 w-1.5 bg-neon-emerald inline-block" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

BuilderCardPreview.displayName = "BuilderCardPreview"
