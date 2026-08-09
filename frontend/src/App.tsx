import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Cpu, ShieldCheck } from "lucide-react"

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

function App() {
  const [activeTab, setActiveTab] = useState<GeneratorTab>("id_card")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1.0)
  const [copySuccess, setCopySuccess] = useState(false)

  // Form values state
  const [formValues, setFormValues] = useState<GeneratorFormValues>({
    name: "",
    role: "Builder",
    title: "",
    techStack: "",
    github: "",
    twitter: "",
    accentColor: "neon-green",
    frameStyle: "cyber",
  })

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

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <div className="h-7 w-7 rounded-lg bg-neon-emerald/10 border border-neon-emerald/20 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-neon-emerald" />
            </div>
            <span className="font-heading font-black text-white text-sm uppercase tracking-wider">
              HHG <span className="text-neon-emerald font-semibold">26</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs uppercase font-heading font-black tracking-wider text-zinc-400">
            <a href="#generator" className="hover:text-white transition-colors">Generator</a>
            <a href="https://x.com/hackerhousegoa" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">About</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Source</a>
          </nav>

          <div>
            <Button
              variant="secondary"
              size="sm"
              className="border-white/10 text-[10px] font-black uppercase tracking-wider hover:bg-white/5"
              onClick={loadDemoPhoto}
            >
              Demo Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-12 pb-6 px-6 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neon-emerald/20 bg-neon-emerald/5 text-[10px] text-neon-emerald font-black uppercase tracking-widest font-heading shadow-[0_0_12px_rgba(0,255,135,0.08)]">
              <Sparkles className="h-3.5 w-3.5" />
              Registration Pass Suite
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white font-heading tracking-tight leading-[1.05] max-w-3xl mx-auto uppercase">
              Hacker House Goa <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-emerald via-[#00ff87] to-cyan-400">
                Builder Generator
              </span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto font-sans leading-relaxed">
              Instantly overlay the verified event profile frame or compile your digital vertical builder pass for prints and social sharing.
            </p>
          </motion.div>
        </section>

        {/* Main Generator App Section */}
        <section id="generator" className="max-w-6xl mx-auto px-6 py-6 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDE: Options Config Panels */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Generator Toggle Navigation Tabs */}
              <Card className="p-1.5 flex gap-1 bg-zinc-950/40" hoverEffect={false}>
                <button
                  onClick={() => setActiveTab("id_card")}
                  role="tab"
                  aria-selected={activeTab === "id_card"}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-heading transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-1 focus:ring-neon-emerald/30 ${
                    activeTab === "id_card" ? "text-black z-10 font-black" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {activeTab === "id_card" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-neon-emerald rounded-lg -z-10 shadow-[0_0_12px_rgba(0,255,135,0.4)]"
                    />
                  )}
                  Builder ID Card
                </button>

                <button
                  onClick={() => setActiveTab("frame")}
                  role="tab"
                  aria-selected={activeTab === "frame"}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-heading transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-1 focus:ring-neon-emerald/30 ${
                    activeTab === "frame" ? "text-black z-10 font-black" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {activeTab === "frame" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-neon-emerald rounded-lg -z-10 shadow-[0_0_12px_rgba(0,255,135,0.4)]"
                    />
                  )}
                  Profile Frame Card
                </button>
              </Card>

              {/* 2. Photo Upload Box */}
              <Card className="p-6 bg-zinc-950/20" hoverEffect={false}>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-heading mb-4 text-left">
                  Step 1: Upload Photo
                </h3>
                <UploadZone onImageSelected={handleImageSelected} selectedImage={selectedImage} />
              </Card>

              {/* 3. Details Form Fields */}
              <Card className="p-6 bg-zinc-950/20" hoverEffect={false}>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-heading mb-4 text-left">
                  Step 2: Configure Details
                </h3>
                <GeneratorForm values={formValues} onChange={handleFieldChange} activeTab={activeTab} />
                
                {/* Controlled Zoom slider for frame position setup */}
                {activeTab === "frame" && selectedImage && (
                  <div className="mt-6 border-t border-white/5 pt-5 animate-fadeIn">
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

            {/* RIGHT SIDE: Real-Time Live Preview Frame */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <Card 
                className="p-6 flex flex-col justify-between items-center text-center bg-zinc-950/30 border border-white/5 relative" 
                hoverEffect={false} 
                glowEffect={selectedImage !== null}
              >
                {/* Glass Header banner */}
                <div className="w-full flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                  <span className="text-xs uppercase font-heading font-black text-zinc-300 tracking-wider">
                    Live Preview Output
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] text-zinc-400 uppercase font-mono font-bold">
                    <ShieldCheck className="h-4 w-4 text-neon-emerald" />
                    Verified Canvas
                  </span>
                </div>

                {/* Live rendering container based on selection tab */}
                <div className="w-full min-h-[350px] flex items-center justify-center bg-zinc-950/50 rounded-2xl border border-white/5 py-2">
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
                          activeColor={activeColor}
                          isProcessing={isProcessing}
                          logs={logs}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action items panel */}
                <div className="w-full mt-6">
                  <ActionPanel
                    onDownload={handleDownload}
                    onCopyLink={handleCopyLink}
                    onShareX={handleShare}
                    isProcessing={isProcessing}
                    copySuccess={copySuccess}
                    hasImage={selectedImage !== null}
                    accentColor={formValues.accentColor}
                  />
                </div>
              </Card>

              {/* Progress Steps list indicator */}
              <Card className="p-4 bg-zinc-950/20" hoverEffect={false}>
                <StepIndicator steps={steps} />
              </Card>
            </div>

          </div>
        </section>
      </main>

      {/* Footer Branding Area */}
      <footer className="w-full border-t border-white/5 py-10 mt-16 text-center text-zinc-450 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-sans font-medium">
          <p>© 2026 Hacker House Goa. Built with React + TypeScript.</p>
          <div className="flex gap-4">
            <span className="text-zinc-500">Goa, IN // 15.2993° N, 74.1240° E</span>
            <span>•</span>
            <a href="https://x.com/hackerhousegoa" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Official X</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
