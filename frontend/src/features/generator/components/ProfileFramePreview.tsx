import { useImperativeHandle, forwardRef, useState, useRef } from "react"
import type { GeneratorFormValues } from "../../../types"
import { use3dTilt } from "../../../hooks/use3dTilt"
import { escapeHtml } from "../../../lib/utils"

interface ProfileFramePreviewProps {
  values: GeneratorFormValues
  imageSrc: string | null
  activeColor: string
  zoom: number
  onZoomChange: (zoom: number) => void
  isProcessing?: boolean
  logs?: string[]
}

export interface ProfileFramePreviewRef {
  download: () => Promise<void>
  getState: () => { zoom: number; position: { x: number; y: number } }
}

export const ProfileFramePreview = forwardRef<ProfileFramePreviewRef, ProfileFramePreviewProps>(
  ({ values, imageSrc, activeColor, zoom, onZoomChange, isProcessing = false, logs = [] }, ref) => {
    // 3D tilt controls
    const { cardRef, tiltStyle, glareStyle, handleMouseMove, handleMouseLeave } = use3dTilt(5)

    // Baseline size of the rendered widget for drag constraints
    const previewSize = 340

    // Clamp coordinates to keep photo within the circular frame cutout (Rc = 62% diameter)
    const clampPosition = (x: number, y: number, currentZoom: number) => {
      const avatarHalfSize = (previewSize * 0.62) / 2
      const maxT = Math.max(0, avatarHalfSize * (currentZoom - 1.0))
      return {
        x: Math.max(-maxT, Math.min(maxT, x)),
        y: Math.max(-maxT, Math.min(maxT, y))
      }
    }

    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll wheel zoom handler
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault()
      const zoomFactor = 0.08
      const direction = e.deltaY < 0 ? 1 : -1
      const nextZoom = Math.max(1.0, Math.min(5.0, zoom + direction * zoomFactor))
      onZoomChange(nextZoom)
      setPosition(pos => clampPosition(pos.x, pos.y, nextZoom))
    }

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }

    const handleMouseMoveImg = (e: React.MouseEvent) => {
      if (!isDragging) return
      const rawX = e.clientX - dragStartRef.current.x
      const rawY = e.clientY - dragStartRef.current.y
      setPosition(clampPosition(rawX, rawY, zoom))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // Mobile touch drag handlers
    const handleTouchStart = (e: React.TouchEvent) => {
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
        setPosition(clampPosition(rawX, rawY, zoom))
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    // SVG markup generator for the high-res redesigned structure
    const getSvgInnerContent = (themeColor: string, roleName: string) => {
      // Escape variables for XSS protection
      const safeRole = escapeHtml(roleName)
      
      return `
        <defs>
          <!-- Mask to clear central cutout -->
          <mask id="cutout">
            <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
            <circle cx="50" cy="50" r="31" fill="#000000" />
          </mask>
          
          <!-- Deep gradient background -->
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#082A1C" />
            <stop offset="100%" stop-color="#050807" />
          </linearGradient>

          <!-- Technical Grid Pattern -->
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="${themeColor}" stroke-width="0.08" opacity="0.06" />
          </pattern>

          <!-- Neon Glow Filter -->
          <filter id="glow-neon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Background with cutout -->
        <g mask="url(#cutout)">
          <!-- Base background -->
          <rect x="0" y="0" width="100" height="100" fill="url(#bg-grad)" />
          
          <!-- Grid Overlay -->
          <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />
          
          <!-- Fine design grid / circuit traces -->
          <line x1="10" y1="5" x2="90" y2="5" stroke="${themeColor}" stroke-width="0.08" opacity="0.1" />
          <line x1="5" y1="10" x2="5" y2="90" stroke="${themeColor}" stroke-width="0.08" opacity="0.1" />
          <line x1="95" y1="10" x2="95" y2="90" stroke="${themeColor}" stroke-width="0.08" opacity="0.1" />
          <line x1="10" y1="95" x2="90" y2="95" stroke="${themeColor}" stroke-width="0.08" opacity="0.1" />

          <!-- Watermark Coastline and Botanical Lines (Goa vibe) -->
          <path d="M -10,80 Q 20,65 50,85 T 110,75" fill="none" stroke="#082A1C" stroke-width="0.4" opacity="0.6" />
          <path d="M -10,83 Q 25,68 48,82 T 110,78" fill="none" stroke="${themeColor}" stroke-width="0.15" opacity="0.1" />

          <!-- Subtle abstract leaf lines -->
          <path d="M 5,30 Q 12,25 15,15 Q 18,25 25,30 Q 15,32 5,30 Z" fill="none" stroke="#082A1C" stroke-width="0.25" opacity="0.4" />
          <path d="M 95,30 Q 88,25 85,15 Q 82,25 75,30 Q 85,32 95,30 Z" fill="none" stroke="#082A1C" stroke-width="0.25" opacity="0.4" />
          
          <!-- Abstract palm frond curve -->
          <path d="M 85,85 C 80,75 88,60 98,52" fill="none" stroke="#082A1C" stroke-width="0.3" opacity="0.4" />
          <path d="M 88,67 Q 78,65 72,70" fill="none" stroke="#082A1C" stroke-width="0.2" opacity="0.3" />
          <path d="M 91,62 Q 82,58 78,65" fill="none" stroke="#082A1C" stroke-width="0.2" opacity="0.3" />

          <!-- Small stars / dots -->
          <circle cx="15" cy="45" r="0.2" fill="#D6B85A" opacity="0.3" />
          <circle cx="85" cy="45" r="0.2" fill="#D6B85A" opacity="0.3" />
          <circle cx="30" cy="22" r="0.15" fill="#F5F5F5" opacity="0.4" />
          <circle cx="70" cy="22" r="0.15" fill="#F5F5F5" opacity="0.4" />
        </g>

        <!-- Outer tech corner lines / borders -->
        <rect x="2" y="2" width="96" height="96" rx="3" fill="none" stroke="#082A1C" stroke-width="0.4" />
        <path d="M 6,2 L 2,2 L 2,6 M 94,2 L 98,2 L 98,6 M 2,94 L 2,98 L 6,98 M 98,94 L 98,98 L 94,98" fill="none" stroke="${themeColor}" stroke-width="0.4" opacity="0.6" />

        <!-- Double-ring circular photo border -->
        <!-- Outer: thin dark emerald -->
        <circle cx="50" cy="50" r="32.2" fill="none" stroke="#082A1C" stroke-width="0.4" />
        <!-- Middle: subtle neon green glow -->
        <circle cx="50" cy="50" r="31.6" fill="none" stroke="${themeColor}" stroke-width="0.5" filter="url(#glow-neon)" opacity="0.8" />
        <!-- Inner: thin warm gold -->
        <circle cx="50" cy="50" r="31.2" fill="none" stroke="#D6B85A" stroke-width="0.25" />

        <!-- Top Header Typography -->
        <g transform="translate(50, 10.5)">
          <text fill="#F5F5F5" font-size="4.2" font-weight="900" text-anchor="middle" class="font-heading" letter-spacing="0.12">HACKER HOUSE GOA</text>
        </g>
        <g transform="translate(50, 14.2)">
          <text fill="#D6B85A" font-size="2.0" font-weight="500" font-family="monospace" text-anchor="middle" letter-spacing="0.08">28–31 OCT 2026</text>
        </g>

        <!-- Builder Badge (lower-left edge of photo cutout) -->
        <g transform="translate(20, 71) rotate(-8)">
          <!-- Dark emerald background with neon green border -->
          <rect x="0" y="0" width="16" height="5" rx="1" fill="#050807" stroke="${themeColor}" stroke-width="0.25" />
          <text x="8" y="3.6" fill="#F5F5F5" font-size="2.4" font-weight="900" text-anchor="middle" class="font-heading" letter-spacing="0.05">${safeRole}</text>
        </g>

        <!-- Bottom Signature -->
        <g transform="translate(50, 88.5)">
          <text fill="#D6B85A" font-size="2.4" font-weight="900" text-anchor="middle" class="font-heading" letter-spacing="0.15">HH</text>
        </g>
        <g transform="translate(50, 92)">
          <text fill="#F5F5F5" font-size="2.6" font-weight="800" text-anchor="middle" class="font-heading" letter-spacing="0.05">HACKER HOUSE GOA</text>
        </g>
        <g transform="translate(50, 94.8)">
          <text fill="#D6B85A" font-size="1.6" font-family="monospace" text-anchor="middle" letter-spacing="0.05">EST. 2026</text>
        </g>

        <!-- Tech Details / monospaced stats in corners -->
        <text x="6" y="22" fill="${themeColor}" font-size="1.8" font-family="monospace" opacity="0.35">&lt;/&gt;</text>
        <text x="6" y="25" fill="#F5F5F5" font-size="1.4" font-family="monospace" opacity="0.2">AI.DEV</text>
        
        <text x="94" y="22" fill="${themeColor}" font-size="1.8" font-family="monospace" text-anchor="end" opacity="0.35">01</text>
        <text x="94" y="25" fill="#F5F5F5" font-size="1.4" font-family="monospace" text-anchor="end" opacity="0.2">VERIFIED</text>
      `
    }

    useImperativeHandle(ref, () => ({
      download: async () => {
        // Dynamically import to keep main bundle tiny
        const { downloadProfileFrame } = await import("../../../lib/canvas")
        await downloadProfileFrame(
          imageSrc,
          values,
          zoom,
          position,
          previewSize,
          activeColor,
          getSvgInnerContent
        )
      },
      getState: () => ({
        zoom,
        position,
      }),
    }))

    return (
      <div className="w-full flex flex-col items-center py-4 select-none animate-fadeIn">
        {/* Shield frame container with 3D tilt */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="w-[300px] md:w-[340px] aspect-square relative bg-transparent overflow-hidden rounded-[24px] cursor-grab active:cursor-grabbing group shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          {/* Glare hologram overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-350 rounded-[24px]"
            style={glareStyle}
          />

          {/* Avatar Base Image - sized and masked to fit inside the 62% circular cutout */}
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
            className="absolute rounded-full overflow-hidden bg-[#050807] z-0"
            style={{
              width: "62%",
              height: "62%",
              left: "19%",
              top: "19%",
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
              <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-zinc-500">
                <div className="h-10 w-10 rounded-full border border-white/5 flex items-center justify-center bg-zinc-900/50 mb-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider font-heading">
                  Avatar Missing
                </span>
              </div>
            )}
          </div>

          {/* Interactive instruction HUD */}
          {imageSrc && !isDragging && (
            <div 
              className="absolute pointer-events-none flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                width: "62%",
                height: "62%",
                left: "19%",
                top: "19%",
              }}
            >
              <div className="bg-black/80 backdrop-blur-[2px] px-3.5 py-1.5 rounded-lg border border-white/10 text-center shadow-lg">
                <span className="text-[9px] text-neon-emerald font-heading uppercase font-bold tracking-widest block">
                  Drag Photo / Scroll Zoom
                </span>
              </div>
            </div>
          )}

          {/* SVG Frame Overlay */}
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
            dangerouslySetInnerHTML={{ __html: getSvgInnerContent(activeColor, values.role || "BUILDER") }}
          />

          {/* HUD processing terminal screen overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-35 flex flex-col justify-end p-6 font-mono text-left text-xs leading-relaxed border border-neon-emerald/30 rounded-[24px]">
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

ProfileFramePreview.displayName = "ProfileFramePreview"
