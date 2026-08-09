import { useImperativeHandle, forwardRef } from "react"
import { MapPin } from "lucide-react"
import type { GeneratorFormValues } from "../../../types"
import { use3dTilt } from "../../../hooks/use3dTilt"

interface BuilderCardPreviewProps {
  values: GeneratorFormValues
  imageSrc: string | null
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
  ({ values, imageSrc, isProcessing = false, logs = [] }, ref) => {
    // 3D tilt controls
    const { cardRef, tiltStyle, glareStyle, handleMouseMove, handleMouseLeave } = use3dTilt(7)

    // Accent color theme resolution
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
        await downloadBuilderCard(imageSrc, values, currentTheme.primary)
      },
    }))

    return (
      <div className="w-full flex justify-center py-4 select-none">
        {/* Card interactive 3D container */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="w-[310px] sm:w-[340px] md:w-[370px] aspect-[5/8] rounded-[24px] relative bg-zinc-950 border p-6 flex flex-col justify-between overflow-hidden cursor-default"
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
