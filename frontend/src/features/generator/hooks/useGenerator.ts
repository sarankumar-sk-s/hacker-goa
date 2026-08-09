import { useState, useCallback } from "react"
import { api } from "../../../lib/api"
import { useToast } from "../../../context/ToastContext"
import type { GeneratorFormValues, GeneratorTab } from "../../../types"

export function useGenerator() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg])
  }, [])

  const resetLogs = useCallback(() => {
    setLogs([])
    setError(null)
  }, [])

  // Helper to convert dataUrl to Blob
  const dataURLtoBlob = useCallback((dataurl: string): Blob => {
    try {
      const arr = dataurl.split(",")
      const mime = arr[0].match(/:(.*?);/)?.[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    } catch (e) {
      throw new Error("Invalid image format.")
    }
  }, [])

  /**
   * Orchestrate upload and generation API pipeline
   */
  const generate = useCallback(async (
    imageSrc: string | null,
    values: GeneratorFormValues,
    activeTab: GeneratorTab,
    frameState: { zoom: number; position: { x: number; y: number } } | null,
    resolution: "1080p" | "4k" = "4k"
  ): Promise<string> => {
    if (!imageSrc) {
      throw new Error("No image uploaded yet.")
    }

    addLog("> Initializing image buffer...")
    const blob = dataURLtoBlob(imageSrc)
    
    addLog(`> Uploading avatar binary (${(blob.size / 1024).toFixed(1)} KB)...`)
    const uploadRes = await api.uploadPhoto(blob)
    const imageId = uploadRes.id
    addLog(`> Upload complete. ID: ${imageId.substring(0, 8)}...`)

    addLog(`> Enqueuing generation for ${activeTab === "id_card" ? "Builder Card" : "Profile Frame"}...`)
    
    let generatedUrl = ""
    if (activeTab === "id_card") {
      const genData = await api.generateBuilderCard({
        image_id: imageId,
        name: values.name || "Builder",
        role: values.role || "Builder",
        title: values.title || "Builder & Hacker",
        tech_stack: values.techStack || "TypeScript, React",
        github: values.github || undefined,
        twitter: values.twitter || undefined,
        accent_color: values.accentColor,
        resolution: resolution,
      })
      generatedUrl = api.getAbsoluteUrl(genData.url)
    } else {
      const zoomValue = frameState?.zoom ?? 1.0
      const xOffset = frameState?.position?.x ?? 0.0
      const yOffset = frameState?.position?.y ?? 0.0

      const genData = await api.generateProfileFrame({
        image_id: imageId,
        accent_color: values.accentColor,
        role: values.role || "Builder",
        zoom: zoomValue,
        x_offset: xOffset,
        y_offset: yOffset,
        resolution: resolution,
      })
      generatedUrl = api.getAbsoluteUrl(genData.url)
    }

    addLog(`> Server-side processing complete.`)
    return generatedUrl
  }, [addLog, dataURLtoBlob])

  return {
    isProcessing,
    logs,
    error,
    generate,
    setIsProcessing,
    addLog,
    resetLogs,
    setError,
    showToast
  }
}
