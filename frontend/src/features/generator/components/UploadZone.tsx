import React, { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { validateFile, convertHeicToJpeg, compressAndResizeImage, detectFaceAndCrop } from "@/lib/imageUtils"
import { useToast } from "@/context/ToastContext"

interface UploadZoneProps {
  onImageSelected: (file: File | null, dataUrl: string | null) => void
  selectedImage: string | null
  frameStyle?: string
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, selectedImage, frameStyle }) => {
  const isClassic = frameStyle === "goa-classic" || frameStyle === "goa-builder"
  const activeColorText = isClassic ? "text-[#FCD205]" : "text-neon-emerald"
  const activeBorder = isClassic ? "border-[#FCD205]" : "border-neon-emerald"
  const activeBg = isClassic ? "bg-[#FCD205]/5" : "bg-neon-emerald/5"
  const activeShadow = isClassic ? "shadow-[0_0_15px_rgba(252,210,5,0.15)]" : "shadow-[0_0_15px_rgba(0,255,135,0.15)]"
  const activeRing = isClassic ? "focus:ring-[#FCD205]/30" : "focus:ring-neon-emerald/30"

  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const processFile = async (file: File) => {
    setError(null)
    setIsProcessing(true)
    setStatus("Reading file...")

    try {
      // 1. Validate file size and type
      const validation = validateFile(file)
      if (!validation.valid) {
        const errorMsg = validation.error || "File validation failed."
        setError(errorMsg)
        showToast(errorMsg, "error")
        setIsProcessing(false)
        setStatus(null)
        return
      }

      let activeFile = file
      const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      const isHeic = file.type === "image/heic" || file.type === "image/heif" || extension === ".heic" || extension === ".heif"

      // 2. Convert HEIC to JPEG if needed
      if (isHeic) {
        setStatus("Converting HEIC format...")
        activeFile = await convertHeicToJpeg(file)
      }

      // 3. Compress and resize large images
      setStatus("Optimizing dimensions...")
      const compressedDataUrl = await compressAndResizeImage(activeFile, 1600, 0.85)

      // 4. Run Face Detection & Crop
      setStatus("Detecting face...")
      const { croppedImage, faceDetected } = await detectFaceAndCrop(compressedDataUrl, (stepStatus) => {
        setStatus(stepStatus)
      })

      // 5. Pass back to parent layout
      onImageSelected(activeFile, croppedImage)
      
      if (!faceDetected) {
        showToast("No face detected. Applying centered focus fallback.", "warning")
      } else {
        showToast("Portrait face successfully aligned!", "success")
      }
    } catch (err: any) {
      console.error(err)
      const errMessage = err.message || "An error occurred while processing the image."
      setError(errMessage)
      showToast(errMessage, "error")
    } finally {
      setIsProcessing(false)
      setStatus(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    if (isProcessing) return
    fileInputRef.current?.click()
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageSelected(null, null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    showToast("Photo removed.", "info")
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
        onChange={handleChange}
        aria-label="Upload profile photo"
      />

      {/* Inline Error alert display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="w-full mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-550/5 text-red-400 text-xs font-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 text-left">
                <p className="font-semibold uppercase tracking-wider text-[10px] font-heading">Upload Failed</p>
                <p className="opacity-80 mt-0.5">{error}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setError(null)
                }}
                className="text-red-400/60 hover:text-red-400 transition-colors p-0.5 hover:bg-white/5 rounded cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: isProcessing ? 1 : 1.002 }}
            onClick={triggerFileInput}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                triggerFileInput()
              }
            }}
            role="button"
            aria-label="Upload photo dropzone. Click or drag image here."
            className={`w-full py-12 px-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 ${activeRing} ${
              isDragActive
                ? `${activeBorder} ${activeBg} ${activeShadow}`
                : "border-white/10 bg-zinc-950/20 hover:border-white/20 hover:bg-zinc-950/40"
            } ${isProcessing ? "pointer-events-none" : ""}`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className={`h-10 w-10 animate-spin mb-4 ${activeColorText}`} />
                <p className="text-sm text-zinc-300 font-heading font-medium tracking-wide">
                  {status}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                  Processing portrait structure...
                </p>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 transition-colors">
                  <Upload className="h-5 w-5 text-zinc-400" />
                </div>
                
                <p className="text-sm text-zinc-300 font-heading font-medium text-center">
                  Drag & drop your builder photo
                </p>
                <p className="text-xs text-zinc-500 mt-1.5 text-center font-sans">
                  Supports PNG, JPG, HEIC formats (Max 10MB)
                </p>
                <span className="mt-4 px-3.5 py-1.5 rounded-lg border border-white/8 bg-white/5 text-xs text-zinc-400 font-semibold hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider text-[10px] font-heading">
                  Browse Files
                </span>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            role="button"
            aria-label="Replace current upload photo"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                triggerFileInput()
              }
            }}
            className={`w-full relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/60 flex items-center justify-center group cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 ${activeRing} ${
              isDragActive ? `${activeBorder} ring-2 ${isClassic ? "ring-[#FCD205]/30" : "ring-neon-emerald/30"} scale-[1.01]` : "hover:border-white/20"
            }`}
          >
            <img
              src={selectedImage}
              alt="Uploaded avatar preview crop"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 opacity-70 group-hover:opacity-85 transition-opacity" />

            {isProcessing && (
              <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-25">
                <Loader2 className={`h-8 w-8 animate-spin mb-3 ${activeColorText}`} />
                <p className="text-xs text-zinc-300 font-heading font-medium tracking-wide">
                  {status}
                </p>
              </div>
            )}

            {isDragActive && (
              <div className={`absolute inset-0 ${isClassic ? "bg-[#FCD205]/15" : "bg-neon-emerald/15"} backdrop-blur-[2px] flex flex-col items-center justify-center border-2 ${activeBorder} rounded-2xl z-20 pointer-events-none`}>
                <Upload className={`h-8 w-8 animate-bounce mb-2 ${activeColorText}`} />
                <p className={`text-sm font-heading font-bold uppercase tracking-wider ${activeColorText}`}>
                  Drop to replace
                </p>
              </div>
            )}

            {/* Hover actions */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(e)
                  }}
                  className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white transition-all transform hover:scale-105 cursor-pointer shadow-lg z-30"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 mb-2 pointer-events-none">
                <span className="p-2 rounded-full bg-black/50 border border-white/10 text-white">
                  <RefreshCw className={`h-4 w-4 animate-pulse ${activeColorText}`} />
                </span>
                <span className="text-xs text-zinc-200 font-bold uppercase tracking-wider font-heading">
                  Click or drag to replace
                </span>
                <span className="text-[9px] text-zinc-400 font-mono">
                  JPG, PNG, HEIC formats
                </span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-zinc-400 font-medium group-hover:opacity-0 transition-opacity duration-300 pointer-events-none z-10">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-black/50 border border-white/10">
                  <ImageIcon className={`h-3.5 w-3.5 ${activeColorText}`} />
                </span>
                <span className="text-zinc-200 font-sans text-[11px] font-semibold">
                  Photo aligned and optimized
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                600x600px
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
