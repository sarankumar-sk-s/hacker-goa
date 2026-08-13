import React from "react"
import { Download, Link, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "../../../components/ui/Button"

// Twitter/X icon standard path
const TwitterXIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

interface ActionPanelProps {
  onDownload: () => void
  onCopyLink: () => void
  onShareX: () => void
  isProcessing: boolean
  copySuccess: boolean
  hasImage: boolean
  accentColor: string
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  onDownload,
  onCopyLink,
  onShareX,
  isProcessing,
  copySuccess,
  hasImage,
  accentColor
}) => {
  const accentGlowStyles: Record<string, string> = {
    "neon-green": "shadow-[0_0_20px_rgba(57,255,20,0.12)] hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] hover:bg-[#39ff14]",
    "cyber-cyan": "shadow-[0_0_20px_rgba(0,240,255,0.12)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:bg-[#00f0ff] hover:text-black",
    "laser-purple": "shadow-[0_0_20px_rgba(189,0,255,0.12)] hover:shadow-[0_0_25px_rgba(189,0,255,0.3)] hover:bg-[#bd00ff] hover:text-white",
    "sunset-orange": "shadow-[0_0_20px_rgba(255,92,0,0.12)] hover:shadow-[0_0_25px_rgba(255,92,0,0.3)] hover:bg-[#ff5c00] hover:text-black",
    "goa-amber": "shadow-[0_0_20px_rgba(252,210,5,0.12)] hover:shadow-[0_0_25px_rgba(252,210,5,0.3)] hover:bg-[#ebd035] hover:text-black"
  }

  const primaryBtnColor: Record<string, string> = {
    "neon-green": "bg-[#39FF14] text-black",
    "cyber-cyan": "bg-[#00F0FF] text-black",
    "laser-purple": "bg-[#BD00FF] text-white",
    "sunset-orange": "bg-[#FF5C00] text-black",
    "goa-amber": "bg-[#FCD205] text-black"
  }

  const activeGlow = accentGlowStyles[accentColor] || accentGlowStyles["neon-green"]
  const activeColor = primaryBtnColor[accentColor] || primaryBtnColor["neon-green"]

  return (
    <div className="w-full space-y-3.5">
      <Button
        variant="primary"
        size="lg"
        onClick={onDownload}
        disabled={isProcessing || !hasImage}
        className={`w-full gap-2.5 uppercase tracking-wider text-xs font-black transition-all duration-300 ${activeColor} ${activeGlow}`}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <Download className="h-4 w-4 shrink-0" />
        )}
        {isProcessing ? "Processing Canvas..." : "Download High-Res PNG"}
      </Button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onCopyLink}
          disabled={isProcessing || !hasImage}
          className="flex-1 gap-2 border-white/5 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/12 text-zinc-300 hover:text-white uppercase tracking-wider text-[10px] font-black"
        >
          {copySuccess ? (
            <CheckCircle2 className="h-4 w-4 text-neon-emerald shrink-0" />
          ) : (
            <Link className="h-4 w-4 shrink-0" />
          )}
          {copySuccess ? "Copied Link!" : "Copy Link"}
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={onShareX}
          disabled={isProcessing || !hasImage}
          className="flex-1 gap-2 border-white/5 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/12 text-zinc-300 hover:text-white uppercase tracking-wider text-[10px] font-black"
        >
          <TwitterXIcon />
          Share on X
        </Button>
      </div>

      {copySuccess && (
        <p className="text-[10px] text-neon-emerald font-heading uppercase font-bold tracking-widest text-center mt-1 animate-pulse">
          Link copied to clipboard! Share it with your friends.
        </p>
      )}

      <p className="text-[9px] text-zinc-500 font-mono mt-2.5 text-center leading-normal">
        * Image exports in native 4K high resolution (up to 3600px). Local export is fallback.
      </p>
    </div>
  )
}
