import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ShieldCheck, MapPin, Calendar, Users, MessageSquare } from "lucide-react"

// Types
import type { GeneratorFormValues, GeneratorTab } from "./types"

// Reusable components
import { Card } from "./components/ui/Card"
import { Button } from "./components/ui/Button"
import { Slider } from "./components/ui/Slider"
import { UploadZone } from "./features/generator/components/UploadZone"
import { BuilderCardPreview, type BuilderCardPreviewRef } from "./features/generator/components/BuilderCardPreview"
import { ProfileFramePreview, type ProfileFramePreviewRef } from "./features/generator/components/ProfileFramePreview"
import { GeneratorForm } from "./features/generator/components/GeneratorForm"
import { ActionPanel } from "./features/generator/components/ActionPanel"
import { StepIndicator } from "./features/generator/components/StepIndicator"

// Hooks & context
import { useGenerator } from "./features/generator/hooks/useGenerator"
import { api } from "./lib/api"
import { useTheme } from "./context/ThemeContext"
import { ThemeToggle } from "./components/ThemeToggle"

function App() {
  const { theme, activeGradient } = useTheme()
  const isGoaNight = activeGradient === "goa-night"
  const [activeTab, setActiveTab] = useState<GeneratorTab>("id_card")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1.0)
  const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 })
  const [builderId] = useState(() => {
    return `HHGOA26-BUILDER-${Math.floor(1000 + Math.random() * 9000)}`
  })
  const [copySuccess, setCopySuccess] = useState(false)
  const [view, setView] = useState<"landing" | "generator">(() => {
    return window.location.hash === "#generator" ? "generator" : "landing"
  })

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#generator") {
        setView("generator")
      } else {
        setView("landing")
      }
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const navigateToGenerator = () => {
    window.location.hash = "#generator"
    setView("generator")
  }

  const navigateToLanding = () => {
    window.location.hash = ""
    setView("landing")
  }

  // Form values state
  const [formValues, setFormValues] = useState<GeneratorFormValues>({
    name: "",
    role: "Builder",
    title: "",
    techStack: "",
    github: "",
    twitter: "",
    accentColor: "neon-green",
    frameStyle: "goa-classic",
  })

  const isGoaTheme = formValues.frameStyle === "goa-classic" || formValues.frameStyle === "goa-builder"

  const activeColor = formValues.accentColor === "cyber-cyan"
    ? "#00F0FF"
    : formValues.accentColor === "laser-purple"
    ? "#BD00FF"
    : formValues.accentColor === "sunset-orange"
    ? "#FF5C00"
    : "#39FF88"

  // References to trigger Canvas generation & downloads
  const cardPreviewRef = useRef<BuilderCardPreviewRef>(null)
  const framePreviewRef = useRef<ProfileFramePreviewRef>(null)

  // Custom generator API pipeline hook
  const {
    isProcessing,
    logs,
    generate,
    setIsProcessing,
    addLog,
    resetLogs,
    showToast
  } = useGenerator()

  // Calculate active steps based on user inputs
  const steps = [
    { id: 1, label: "Upload Photo", completed: selectedImage !== null },
    { id: 2, label: "Personal Details", completed: formValues.name.trim().length > 1 && formValues.title.trim().length > 1 },
    { id: 3, label: "Customize Themes", completed: true },
  ]

  // Handle input change
  const handleFieldChange = (field: keyof GeneratorFormValues, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle photo selection
  const handleImageSelected = (_file: File | null, dataUrl: string | null) => {
    setSelectedImage(dataUrl)
  }

  // Handle Download trigger (with client-side fallback)
  const handleDownload = async () => {
    if (!selectedImage) {
      showToast("Please upload your builder photo first!", "warning")
      return
    }

    setIsProcessing(true)
    resetLogs()

    // Bypassing backend for Goa Classic Frame & Card (Frame 2) to render high-res details locally
    if (isGoaTheme) {
      addLog("> Initiating client-side canvas generation for Goa Heritage...")
      try {
        if (activeTab === "id_card") {
          await cardPreviewRef.current?.download()
        } else {
          await framePreviewRef.current?.download()
        }
        addLog("> Local canvas draw exported successfully.")
        showToast("Goa Heritage asset downloaded!", "success")
        
        const confettiModule = await import("canvas-confetti")
        confettiModule.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#082A1C", "#FFD43B", "#D92B5A", "#FAF7F2"],
        })
      } catch (localErr) {
        console.error("Local export failure:", localErr)
        showToast("Failed to export image. Please try again.", "error")
      } finally {
        setIsProcessing(false)
      }
      return
    }

    try {
      let frameState = null
      if (activeTab === "frame" && framePreviewRef.current) {
        frameState = framePreviewRef.current.getState()
      }

      // Try generating high-res 4K image on the backend
      const downloadUrl = await generate(selectedImage, formValues, activeTab, frameState, "4k")
      
      addLog("> Retrieving image stream from cluster storage...")
      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error("Failed to download image bytes from backend.")
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      addLog("> Triggering browser download action...")
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = activeTab === "id_card" 
        ? `HH_Goa_Builder_Card_${formValues.name.replace(/\s+/g, "_") || "2026"}.png`
        : `HH_Goa_Profile_Frame_${formValues.name.replace(/\s+/g, "_") || "2026"}.png`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      addLog("> High-resolution image downloaded successfully.")
      showToast("High-resolution pass downloaded!", "success")

      // Success confetti triggers asynchronously
      const confettiModule = await import("canvas-confetti")
      confettiModule.default({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#39FF14", "#00F0FF", "#BD00FF", "#FF5C00", "#ffffff"],
      })
    } catch (e) {
      console.warn("Backend generation failed, falling back to local canvas export:", e)
      addLog("> Server-side render failed. Bootstrapping local canvas drawing fallback...")
      try {
        if (activeTab === "id_card") {
          await cardPreviewRef.current?.download()
        } else {
          await framePreviewRef.current?.download()
        }
        addLog("> Local canvas draw exported.")
        showToast("Pass generated locally. (Local fallback)", "info")
        
        const confettiModule = await import("canvas-confetti")
        confettiModule.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      } catch (localErr) {
        console.error("Local export failure:", localErr)
        showToast("Failed to export image. Please try again.", "error")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Copy Link
  const handleCopyLink = async () => {
    if (!selectedImage) {
      showToast("Please upload your builder photo first!", "warning")
      return
    }

    setIsProcessing(true)
    resetLogs()
    setCopySuccess(false)

    // Bypassing backend for Goa Classic Frame & Card (Frame 2) share links
    if (isGoaTheme) {
      try {
        await navigator.clipboard.writeText(window.location.origin)
        addLog("> Website link copied for Goa Heritage.")
        setCopySuccess(true)
        showToast("Website link copied! Download image to share directly.", "success")
        setTimeout(() => setCopySuccess(false), 4000)
      } catch (err) {
        showToast("Failed to copy link.", "error")
      } finally {
        setIsProcessing(false)
      }
      return
    }

    try {
      let frameState = null
      if (activeTab === "frame" && framePreviewRef.current) {
        frameState = framePreviewRef.current.getState()
      }

      const downloadUrl = await generate(selectedImage, formValues, activeTab, frameState, "4k")
      
      addLog("> Registering secure sharing record...")
      const pathParts = downloadUrl.split("/")
      const imageId = pathParts[pathParts.length - 1]
      
      const shareData = await api.registerShare(imageId)
      const shareUrl = api.getAbsoluteUrl(shareData.share_url)

      await navigator.clipboard.writeText(shareUrl)
      addLog("> Sharing link registered and copied.")
      setCopySuccess(true)
      showToast("Shareable link copied to clipboard!", "success")
      setTimeout(() => setCopySuccess(false), 4000)
    } catch (e) {
      console.error("Failed to copy link via backend:", e)
      showToast("Failed to generate shareable link. Is the backend running?", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Share to X (Twitter Intent)
  const handleShare = async () => {
    if (!selectedImage) {
      showToast("Please upload your builder photo first!", "warning")
      return
    }

    setIsProcessing(true)
    resetLogs()

    // Bypassing backend for Goa Classic Frame & Card (Frame 2) Twitter/X sharing intent
    if (isGoaTheme) {
      const text = activeTab === "id_card"
        ? "🚀 Just created my Hacker House Goa 2026 Builder Card (Goa Heritage)!\n\nReady to build something amazing.\n\n"
        : "🚀 Just created my Hacker House Goa 2026 Profile Frame (Goa Heritage)!\n\nReady to build something amazing.\n\n"
      const fallbackUrl = window.location.origin
      const hashtags = "FrameInGoa"
      const shareUrlX = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fallbackUrl)}&hashtags=${encodeURIComponent(hashtags)}`
      window.open(shareUrlX, "_blank")
      showToast("X share portal opened!", "success")
      setIsProcessing(false)
      return
    }

    try {
      let frameState = null
      if (activeTab === "frame" && framePreviewRef.current) {
        frameState = framePreviewRef.current.getState()
      }

      const downloadUrl = await generate(selectedImage, formValues, activeTab, frameState, "4k")
      
      addLog("> Registering secure sharing record...")
      const pathParts = downloadUrl.split("/")
      const imageId = pathParts[pathParts.length - 1]
      
      const shareData = await api.registerShare(imageId)
      const shareUrl = api.getAbsoluteUrl(shareData.share_url)

      const text = activeTab === "id_card"
        ? "🚀 Just created my Hacker House Goa 2026 Builder Card!\n\nReady to build something amazing.\n\n"
        : "🚀 Just created my Hacker House Goa 2026 Profile Frame!\n\nReady to build something amazing.\n\n"
      
      const hashtags = "FrameInGoa"
      const shareUrlX = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`
      
      addLog("> Redirecting to X Twitter portal...")
      window.open(shareUrlX, "_blank")
      showToast("X share portal opened!", "success")
    } catch (e) {
      console.warn("Backend sharing failed, falling back to local URL compose:", e)
      const text = activeTab === "id_card"
        ? "🚀 Just created my Hacker House Goa 2026 Builder Card!\n\nReady to build something amazing.\n\n"
        : "🚀 Just created my Hacker House Goa 2026 Profile Frame!\n\nReady to build something amazing.\n\n"
      const fallbackUrl = window.location.href
      const hashtags = "FrameInGoa"
      const shareUrlX = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fallbackUrl)}&hashtags=${encodeURIComponent(hashtags)}`
      window.open(shareUrlX, "_blank")
    } finally {
      setIsProcessing(false)
    }
  }

  // Load a premium demo image for instantly testing the preview experience
  const loadDemoPhoto = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 400)
      grad.addColorStop(0, "#10b981")
      grad.addColorStop(1, "#3b82f6")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 400, 400)
      
      // Face shape
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(200, 160, 60, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(200, 360, 120, Math.PI, Math.PI * 2)
      ctx.fill()
      
      setSelectedImage(canvas.toDataURL("image/png"))
      showToast("Demo photo loaded. Ready to test!", "info")
    }
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-neon-emerald/30 selection:text-white flex flex-col justify-between">
      {/* Dynamic theme glows in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square radial-glow pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] aspect-square radial-glow pointer-events-none opacity-40" />
      <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />

      {view === "landing" ? (
        <div className="relative flex-grow flex flex-col justify-between overflow-x-hidden">
          
          {/* Background image & overlays */}
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-700"
            style={{ 
              backgroundImage: `url('/goa_landing_bg.png')`,
              filter: isGoaNight ? "brightness(0.6) contrast(1.15)" : undefined
            }} 
          />
          <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isGoaNight
              ? "bg-[#052017]/75"
              : theme === "light"
              ? "bg-[#FFF7E6]/75"
              : "bg-black/65"
          }`} />
          <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isGoaNight
              ? "bg-gradient-to-b from-[#052017]/90 via-[#0B4B2E]/70 to-[#052017]"
              : theme === "light" 
              ? "bg-gradient-to-b from-[#FFF7E6]/90 via-[#FFF7E6]/80 to-[#FFF7E6]" 
              : "bg-gradient-to-b from-black/40 via-black/20 to-[#09090b]"
          }`} />

          {/* Navigation Header */}
          <header className="w-full z-40 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
              <button 
                onClick={navigateToLanding} 
                className="flex items-center gap-3 hover:opacity-90 transition-opacity bg-transparent border-none p-0 cursor-pointer"
              >
                <svg viewBox="0 0 40 40" className={`h-9 w-9 ${
                  isGoaNight ? "text-[#FFC700]" : theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"
                }`}>
                  <rect x="6" y="6" width="8" height="28" rx="2" fill="currentColor" />
                  <rect x="26" y="6" width="8" height="28" rx="2" fill="currentColor" />
                  <rect x="14" y="16" width="12" height="8" rx="1" fill="currentColor" />
                  <circle cx="10" cy="10" r="2" fill={isGoaNight ? "#052017" : theme === "light" ? "#FFF7E6" : "#09090b"} />
                  <circle cx="30" cy="10" r="2" fill={isGoaNight ? "#052017" : theme === "light" ? "#FFF7E6" : "#09090b"} />
                </svg>
                <div className="flex flex-col text-left">
                  <span className={`font-heading font-black text-xs sm:text-sm uppercase tracking-widest leading-tight ${
                    theme === "light" && !isGoaNight ? "text-[#052017]" : "text-white"
                  }`}>
                    HACKER HOUSE
                  </span>
                  <span className={`font-heading font-black text-[10px] sm:text-xs uppercase tracking-widest leading-tight ${
                    isGoaNight ? "text-[#FFC700]" : theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"
                  }`}>
                    GOA
                  </span>
                </div>
              </button>

              {/* Right Top Corner: Theme Toggle & Action */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                  onClick={navigateToGenerator}
                  className={
                    isGoaNight
                      ? "bg-[#FFC700] hover:bg-[#ebd035] text-black border-none text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-2 sm:px-5 sm:py-2.5 shadow-[0_0_15px_rgba(0,255,135,0.35)] flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                      : theme === "light"
                      ? "bg-gradient-to-r from-[#1E6F43] to-[#FFC700] hover:opacity-95 text-white border-none text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-2 sm:px-5 sm:py-2.5 shadow-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                      : "bg-[#FCD205] hover:bg-[#ebd035] text-black border-none text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-2 sm:px-5 sm:py-2.5 shadow-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer animate-pulse hover:animate-none"
                  }
                >
                  BUILD YOUR CARD <span className="text-xs">→</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-grow flex items-center py-12 md:py-20 z-10 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* LEFT Column: Text & Buttons */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
                
                {/* Event badge indicators */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`h-4.5 w-[3px] rounded-full inline-block ${
                      isGoaNight ? "bg-[#FFC700]" : theme === "light" ? "bg-[#1E6F43]" : "bg-[#FCD205]"
                    }`}></span>
                    <span className={`text-[11px] uppercase font-heading font-black tracking-widest ${
                      isGoaNight ? "text-[#FFC700]" : theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"
                    }`}>
                      HACKER HOUSE GOA 2026
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4.5 w-[3px] bg-[#FF5CA8] rounded-full inline-block"></span>
                    <span className="text-[11px] uppercase font-heading font-black tracking-widest text-[#FF5CA8]">
                      28–31 OCT · GOA, INDIA
                    </span>
                  </div>
                </div>

                {/* Heading */}
                <h1 className={`text-5xl sm:text-6xl md:text-7xl font-heading font-black tracking-tight leading-[1.05] uppercase text-left max-w-2xl ${
                  theme === "light" && !isGoaNight ? "text-[#052017]" : "text-white"
                }`}>
                  BUILD YOUR <br />
                  <span className={isGoaNight ? "text-[#FFC700]" : "text-active-gradient"}>
                    HACKER IDENTITY.
                  </span>
                </h1>

                {/* Subtitle description */}
                <p className={`text-sm md:text-base font-sans max-w-lg text-left leading-relaxed ${
                  theme === "light" && !isGoaNight ? "text-[#1E6F43]" : "text-zinc-200 font-medium"
                }`}>
                  Create your Hacker House Goa 2026 Builder Card and share it with your community.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 justify-start pt-2">
                  <Button
                    onClick={navigateToGenerator}
                    className={
                      isGoaNight
                        ? "bg-[#FFC700] hover:bg-[#ebd035] text-black font-black uppercase tracking-wider text-xs px-6 py-4 shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all duration-300 cursor-pointer border-none"
                        : "bg-active-gradient hover:opacity-95 text-white font-black uppercase tracking-wider text-xs px-6 py-4 shadow-lg transition-all duration-300 cursor-pointer border-none"
                    }
                  >
                    CREATE YOUR BUILDER CARD <span className="text-xs">→</span>
                  </Button>
                </div>

              </div>

              {/* RIGHT Column: Builder Card Preview */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Subtle soft glowing backplate */}
                  <div className={`absolute inset-0 blur-[100px] rounded-full pointer-events-none ${
                    theme === "light" ? "bg-[#B7DCC6]/30" : "bg-[#FCD205]/5"
                  }`} />
                  
                  {/* Floating and rotated card container */}
                  <motion.div
                    animate={{
                      y: [-8, 8, -8],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      transform: "rotate(-3.5deg)"
                    }}
                    className="relative drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_30px_50px_rgba(252,210,5,0.15)] transition-all duration-300"
                  >
                    <BuilderCardPreview
                      values={formValues}
                      imageSrc={selectedImage}
                      zoom={zoom}
                      onZoomChange={setZoom}
                      position={photoPosition}
                      onPositionChange={setPhotoPosition}
                      builderId={builderId}
                    />
                  </motion.div>
                </div>
              </div>

            </div>
          </main>

          {/* Bottom Information Strip */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-4 z-10 relative">
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
              theme === "light"
                ? "border-[#0B4B2E]/15 bg-white/80 shadow-sm"
                : "border-white/5 bg-black/45"
            }`}>
              {/* Item 1 */}
              <div className="flex items-start gap-4 text-left">
                <MapPin className={`h-6 w-6 shrink-0 mt-1 ${theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"}`} />
                <div>
                  <h4 className={`text-xs uppercase font-heading font-black tracking-wider ${theme === "light" ? "text-[#052017]" : "text-white"}`}>
                    Goa, India
                  </h4>
                  <p className={`text-[11px] font-sans mt-0.5 leading-relaxed ${theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"}`}>
                    Build something unforgettable.
                  </p>
                </div>
              </div>
              {/* Item 2 */}
              <div className={`flex items-start gap-4 text-left border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 ${
                theme === "light" ? "border-[#0B4B2E]/10" : "border-white/5"
              }`}>
                <Calendar className={`h-6 w-6 shrink-0 mt-1 ${theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"}`} />
                <div>
                  <h4 className={`text-xs uppercase font-heading font-black tracking-wider ${theme === "light" ? "text-[#052017]" : "text-white"}`}>
                    28–31 OCT 2026
                  </h4>
                  <p className={`text-[11px] font-sans mt-0.5 leading-relaxed ${theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"}`}>
                    4 days of building, hacking and connecting.
                  </p>
                </div>
              </div>
              {/* Item 3 */}
              <div className={`flex items-start gap-4 text-left border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 ${
                theme === "light" ? "border-[#0B4B2E]/10" : "border-white/5"
              }`}>
                <Users className={`h-6 w-6 shrink-0 mt-1 ${theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"}`} />
                <div>
                  <h4 className={`text-xs uppercase font-heading font-black tracking-wider ${theme === "light" ? "text-[#052017]" : "text-white"}`}>
                    100+
                  </h4>
                  <p className={`text-[11px] font-sans mt-0.5 leading-relaxed ${theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"}`}>
                    Builders / Makers / Hackers
                  </p>
                </div>
              </div>
              {/* Item 4 */}
              <div className={`flex items-start gap-4 text-left border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 ${
                theme === "light" ? "border-[#0B4B2E]/10" : "border-white/5"
              }`}>
                <MessageSquare className={`h-6 w-6 shrink-0 mt-1 ${theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"}`} />
                <div>
                  <h4 className={`text-xs uppercase font-heading font-black tracking-wider ${theme === "light" ? "text-[#052017]" : "text-white"}`}>
                    CONNECT
                  </h4>
                  <p className={`text-[11px] font-sans mt-0.5 leading-relaxed ${theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"}`}>
                    Meet builders from everywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="animate-fadeIn w-full flex flex-col justify-between flex-grow relative">
          {/* Background image & overlays for Generator */}
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-25 transition-opacity duration-700 -z-10"
            style={{ 
              backgroundImage: `url('/goa_landing_bg.png')`,
              filter: isGoaNight ? "brightness(0.5) contrast(1.15) hue-rotate(80deg)" : theme === "light" ? "brightness(0.9) contrast(1.05)" : "brightness(0.35) contrast(1.1)"
            }} 
          />
          <div className={`absolute inset-0 pointer-events-none -z-10 transition-colors duration-500 ${
            isGoaNight
              ? "bg-[#052017]/85"
              : theme === "light"
              ? "bg-[#FFF7E6]/85"
              : "bg-black/75"
          }`} />

          {/* Sticky Header */}
          <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
            isGoaNight
              ? "border-[#1E6F43]/30 bg-[#052017]/90"
              : theme === "light" 
              ? "border-[#0B4B2E]/15 bg-[#FFF7E6]/85" 
              : "border-white/5 bg-background/75"
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <button 
                onClick={navigateToLanding} 
                className="flex items-center gap-3 hover:opacity-90 transition-opacity bg-transparent border-none p-0 cursor-pointer"
              >
                <svg viewBox="0 0 40 40" className={`h-8 w-8 ${
                  isGoaNight ? "text-[#FFC700]" : theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"
                }`}>
                  <rect x="6" y="6" width="8" height="28" rx="2" fill="currentColor" />
                  <rect x="26" y="6" width="8" height="28" rx="2" fill="currentColor" />
                  <rect x="14" y="16" width="12" height="8" rx="1" fill="currentColor" />
                  <circle cx="10" cy="10" r="2" fill={isGoaNight ? "#052017" : theme === "light" ? "#FFF7E6" : "#09090b"} />
                  <circle cx="30" cy="10" r="2" fill={isGoaNight ? "#052017" : theme === "light" ? "#FFF7E6" : "#09090b"} />
                </svg>
                <div className="flex flex-col text-left">
                  <span className={`font-heading font-black text-xs uppercase tracking-widest leading-tight ${
                    theme === "light" && !isGoaNight ? "text-[#052017]" : "text-white"
                  }`}>
                    HACKER HOUSE
                  </span>
                  <span className={`font-heading font-black text-[10px] uppercase tracking-widest leading-tight ${
                    isGoaNight ? "text-[#FFC700]" : theme === "light" ? "text-[#1E6F43]" : "text-[#FCD205]"
                  }`}>
                    GOA
                  </span>
                </div>
              </button>

              <nav className={`hidden md:flex items-center gap-6 text-[10px] uppercase font-heading font-black tracking-wider ${
                isGoaNight ? "text-zinc-200" : theme === "light" && !isGoaNight ? "text-[#1E6F43]" : "text-zinc-300"
              }`}>
                <button 
                  onClick={navigateToLanding} 
                  className={`cursor-pointer transition-colors bg-transparent border-none p-0 ${
                    theme === "light" && !isGoaNight ? "hover:text-[#052017]" : "hover:text-white"
                  }`}
                >
                  Home
                </button>
                <span className={isGoaNight ? "text-[#1E6F43]" : theme === "light" && !isGoaNight ? "text-[#0B4B2E]/30" : "text-zinc-600"}>|</span>
                <span className={isGoaNight ? "text-[#00FF87] font-bold" : theme === "light" && !isGoaNight ? "text-[#052017] font-bold" : "text-neon-emerald font-bold"}>Generator</span>
              </nav>

              {/* Right Top Corner Header Controls */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                  variant="secondary"
                  size="sm"
                  className={
                    isGoaNight
                      ? "border-[#1E6F43]/40 text-white bg-[#052017]/80 hover:bg-[#0B4B2E] text-[10px] font-black uppercase tracking-wider"
                      : theme === "light" && !isGoaNight
                      ? "border-[#0B4B2E]/20 text-[#052017] bg-white/80 hover:bg-white text-[10px] font-black uppercase tracking-wider shadow-sm"
                      : "border-white/10 text-white text-[10px] font-black uppercase tracking-wider hover:bg-white/5"
                  }
                  onClick={loadDemoPhoto}
                >
                  Demo Profile
                </Button>
              </div>
            </div>
          </header>

          {/* Generator main panel */}
          <main className="flex-grow">
            <section className="relative pt-12 pb-6 px-6 text-center max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${
                  isGoaNight
                    ? "border-[#FFC700]/50 bg-[#052017]/90 text-[#FFC700] shadow-[0_0_15px_rgba(0,255,135,0.25)]"
                    : theme === "light" && !isGoaNight
                    ? "border-[#0B4B2E]/20 bg-white/90 text-[#052017] shadow-sm"
                    : "border-neon-emerald/30 bg-black/60 text-[#00FF87] shadow-[0_0_12px_rgba(0,255,135,0.15)]"
                } text-[10px] font-black uppercase tracking-widest font-heading`}>
                  <Sparkles className={`h-3.5 w-3.5 ${isGoaNight ? "text-[#FFC700]" : theme === "light" && !isGoaNight ? "text-[#1E6F43]" : "text-[#00FF87]"}`} />
                  Registration Pass Suite
                </div>

                <h1 className={`text-4xl sm:text-6xl font-black font-heading tracking-tight leading-[1.05] max-w-3xl mx-auto uppercase ${
                  theme === "light" && !isGoaNight ? "text-[#052017]" : "text-white"
                }`}>
                  Hacker House Goa <br className="hidden sm:inline" />
                  <span className={isGoaNight ? "text-[#FFC700]" : "text-active-gradient"}>
                    Builder Generator
                  </span>
                </h1>

                <p className={`text-sm sm:text-base max-w-xl mx-auto font-sans leading-relaxed ${
                  isGoaNight ? "text-zinc-300" : theme === "light" ? "text-[#1E6F43]" : "text-zinc-400"
                }`}>
                  Instantly overlay the verified event profile frame or compile your digital vertical builder pass for prints and social sharing.
                </p>
              </div>
            </section>

            {/* Generator Grid */}
            <section id="generator" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 scroll-mt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT SIDE */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className={`p-1.5 flex gap-1 ${
                    isGoaNight 
                      ? "bg-[#052017]/80 border-[#1E6F43]/30" 
                      : theme === "light" 
                      ? "bg-white/70 border-[#0B4B2E]/15" 
                      : "bg-zinc-950/40"
                  }`} hoverEffect={false}>
                    <button
                      onClick={() => setActiveTab("id_card")}
                      role="tab"
                      aria-selected={activeTab === "id_card"}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-heading transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-1 focus:ring-[#00FF87]/30 ${
                        activeTab === "id_card" 
                          ? (isGoaNight ? "text-black z-10 font-black" : "text-white z-10 font-black") 
                          : (isGoaNight ? "text-white/90 hover:text-white z-10 font-bold" : theme === "light" ? "text-[#052017] hover:text-[#1E6F43]" : "text-zinc-300 hover:text-white")
                      }`}
                    >
                      {activeTab === "id_card" && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className={`absolute inset-0 rounded-lg -z-10 ${
                            isGoaNight ? "bg-[#FFC700] shadow-[0_0_15px_rgba(0,255,135,0.35)]" : "bg-active-gradient shadow-md"
                          }`}
                        />
                      )}
                      Builder ID Card
                    </button>

                    <button
                      onClick={() => setActiveTab("frame")}
                      role="tab"
                      aria-selected={activeTab === "frame"}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-heading transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-1 focus:ring-[#00FF87]/30 ${
                        activeTab === "frame" 
                          ? (isGoaNight ? "text-black z-10 font-black" : "text-white z-10 font-black") 
                          : (isGoaNight ? "text-white/90 hover:text-white z-10 font-bold" : theme === "light" ? "text-[#052017] hover:text-[#1E6F43]" : "text-zinc-300 hover:text-white")
                      }`}
                    >
                      {activeTab === "frame" && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className={`absolute inset-0 rounded-lg -z-10 ${
                            isGoaNight ? "bg-[#FFC700] shadow-[0_0_15px_rgba(0,255,135,0.35)]" : "bg-active-gradient shadow-md"
                          }`}
                        />
                      )}
                      Profile Frame Card
                    </button>
                  </Card>

                  <Card className={`p-6 ${
                    isGoaNight 
                      ? "bg-[#052017]/85 border-[#1E6F43]/35 text-white" 
                      : theme === "light" 
                      ? "bg-white/80 border-[#0B4B2E]/15" 
                      : "bg-zinc-950/20"
                  }`} hoverEffect={false}>
                    <h3 className={`text-xs font-black uppercase tracking-widest font-heading mb-4 text-left ${
                      isGoaNight ? "text-zinc-200" : theme === "light" ? "text-[#052017]" : "text-zinc-400"
                    }`}>
                      Step 1: Upload Photo
                    </h3>
                    <UploadZone onImageSelected={handleImageSelected} selectedImage={selectedImage} frameStyle={formValues.frameStyle} />
                  </Card>

                  <Card className={`p-6 ${
                    isGoaNight 
                      ? "bg-[#052017]/85 border-[#1E6F43]/35 text-white" 
                      : theme === "light" 
                      ? "bg-white/80 border-[#0B4B2E]/15" 
                      : "bg-zinc-950/20"
                  }`} hoverEffect={false}>
                    <h3 className={`text-xs font-black uppercase tracking-widest font-heading mb-4 text-left ${
                      isGoaNight ? "text-zinc-200" : theme === "light" ? "text-[#052017]" : "text-zinc-400"
                    }`}>
                      Step 2: Configure Details
                    </h3>
                    <GeneratorForm values={formValues} onChange={handleFieldChange} activeTab={activeTab} />
                    
                    {selectedImage && (activeTab === "frame" || isGoaTheme) && (
                      <div className={`mt-6 border-t pt-5 animate-fadeIn ${
                        isGoaNight ? "border-[#1E6F43]/30" : theme === "light" ? "border-[#0B4B2E]/10" : "border-white/5"
                      }`}>
                        <Slider
                          label="Adjust Crop Zoom"
                          min={1.0}
                          max={4.0}
                          step={0.1}
                          value={zoom}
                          onChange={setZoom}
                          accentColor={formValues.accentColor}
                        />
                      </div>
                    )}
                  </Card>
                </div>

                {/* RIGHT SIDE */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                  <Card 
                    className={`p-3.5 sm:p-6 flex flex-col justify-between items-center text-center relative ${
                      isGoaNight 
                        ? "bg-[#052017]/85 border-[#1E6F43]/35 text-white" 
                        : theme === "light" 
                        ? "bg-white/90 border-[#0B4B2E]/15 shadow-sm" 
                        : "bg-zinc-950/30 border-white/5"
                    }`} 
                    hoverEffect={false} 
                    glowEffect={selectedImage !== null}
                  >
                    <div className={`w-full flex items-center justify-between border-b pb-4 mb-4 select-none ${
                      isGoaNight ? "border-[#1E6F43]/30" : theme === "light" ? "border-[#0B4B2E]/10" : "border-white/5"
                    }`}>
                      <span className={`text-xs uppercase font-heading font-black tracking-wider ${
                        isGoaNight ? "text-white" : theme === "light" ? "text-[#052017]" : "text-zinc-300"
                      }`}>
                        Live Preview Output
                      </span>
                      <span className={`flex items-center gap-1.5 text-[9px] uppercase font-mono font-bold ${
                        isGoaNight ? "text-[#00FF87]" : theme === "light" ? "text-[#1E6F43]" : "text-zinc-450"
                      }`}>
                        <ShieldCheck className={`h-4 w-4 ${isGoaNight ? "text-[#00FF87]" : theme === "light" ? "text-[#1E6F43]" : "text-neon-emerald"}`} />
                        Verified Canvas
                      </span>
                    </div>

                    <div className={`w-full min-h-[350px] flex items-center justify-center rounded-2xl border py-2 ${
                      isGoaNight ? "bg-[#041811]/70 border-[#1E6F43]/30" : theme === "light" ? "bg-[#FFF7E6]/50 border-[#0B4B2E]/10" : "bg-zinc-950/50 border-white/5"
                    }`}>
                      <AnimatePresence mode="wait">
                        {activeTab === "id_card" ? (
                          <motion.div
                            key="card-preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="w-full"
                          >
                            <BuilderCardPreview
                              ref={cardPreviewRef}
                              values={formValues}
                              imageSrc={selectedImage}
                              zoom={zoom}
                              onZoomChange={setZoom}
                              position={photoPosition}
                              onPositionChange={setPhotoPosition}
                              builderId={builderId}
                              isProcessing={isProcessing}
                              logs={logs}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="frame-preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="w-full"
                          >
                            <ProfileFramePreview
                              ref={framePreviewRef}
                              values={formValues}
                              imageSrc={selectedImage}
                              zoom={zoom}
                              onZoomChange={setZoom}
                              position={photoPosition}
                              onPositionChange={setPhotoPosition}
                              builderId={builderId}
                              activeColor={activeColor}
                              isProcessing={isProcessing}
                              logs={logs}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-full mt-6">
                      <ActionPanel
                        onDownload={handleDownload}
                        onCopyLink={handleCopyLink}
                        onShareX={handleShare}
                        isProcessing={isProcessing}
                        copySuccess={copySuccess}
                        hasImage={selectedImage !== null}
                        accentColor={isGoaTheme ? "goa-amber" : formValues.accentColor}
                      />
                    </div>
                  </Card>

                  <Card className={`p-4 ${theme === "light" ? "bg-white/80 border-[#0B4B2E]/15" : "bg-zinc-950/20"}`} hoverEffect={false}>
                    <StepIndicator steps={steps} />
                  </Card>
                </div>

              </div>
            </section>

            {/* Footer */}
            <footer className={`w-full border-t py-10 mt-16 text-center select-none ${
              theme === "light" ? "border-[#0B4B2E]/15 text-[#1E6F43]" : "border-white/5 text-zinc-450"
            }`}>
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-sans font-medium">
                <p>© 2026 Hacker House Goa. Built with React + TypeScript.</p>
                <div className="flex gap-4">
                  <span className={theme === "light" ? "text-[#052017]" : "text-zinc-500"}>Goa, IN // 15.2993° N, 74.1240° E</span>
                  <span>•</span>
                  <a 
                    href="https://x.com/hackerhousegoa" 
                    target="_blank" 
                    rel="noreferrer" 
                    className={`transition-colors ${theme === "light" ? "hover:text-[#052017] font-bold" : "hover:text-white"}`}
                  >
                    Official X
                  </a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
