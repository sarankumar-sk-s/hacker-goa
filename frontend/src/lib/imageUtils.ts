// Allowed extensions and MIME types
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".heif"]
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validates file size and type
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check extension as fallback if MIME type is empty (common for HEIC on some OS)
  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
  const isTypeAllowed = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension)

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload JPG, PNG, or HEIC.",
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File is too large. Maximum allowed size is 10MB.",
    }
  }

  return { valid: true }
}

/**
 * Converts HEIC/HEIF file to JPEG blob
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const heic2anyModule = await import("heic2any")
    const heic2any = heic2anyModule.default

    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    })

    const blob = Array.isArray(result) ? result[0] : result
    const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg")
    return new File([blob], newName, { type: "image/jpeg" })
  } catch (error) {
    console.error("HEIC conversion failed:", error)
    throw new Error("Failed to process HEIC file. The file might be corrupted.")
  }
}

/**
 * Resizes and compresses image to speed up face detection and keep file sizes small
 */
export function compressAndResizeImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Downscale only if exceeds max limit
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context creation failed"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.onerror = () => {
        reject(new Error("Failed to load image for optimization."))
      }
    }
    reader.onerror = () => {
      reject(new Error("Failed to read upload file."))
    }
  })
}

// Global cached face-api module instance
let faceapiInstance: any = null

/**
 * Lazy loads face-api.js from jsdelivr CDN only when starting detection
 */
async function loadFaceApi() {
  if (faceapiInstance) return faceapiInstance

  try {
    // Dynamic runtime evaluation of module import to bypass TypeScript build-time static checks
    const loadModule = new Function("url", "return import(url)")
    const module = await loadModule("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js")
    faceapiInstance = module
    
    // Load tiny face detector weights
    await faceapiInstance.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model")
    return faceapiInstance
  } catch (error) {
    console.error("Failed to load FaceAPI from CDN:", error)
    throw new Error("Could not load face detection service. Check your internet connection.")
  }
}

/**
 * Detects faces and crops the image to a square.
 * Centers the crop on the face with padding if detected, falls back to center crop otherwise.
 */
export function detectFaceAndCrop(
  imageSrc: string,
  onStatusChange?: (status: string) => void
): Promise<{ croppedImage: string; faceDetected: boolean }> {
  return new Promise(async (resolve, reject) => {
    try {
      onStatusChange?.("Initializing face detector...")
      const faceapi = await loadFaceApi()

      onStatusChange?.("Loading image...")
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      img.onload = async () => {
        try {
          onStatusChange?.("Analyzing portrait face...")
          // Run tiny face detector model
          const detections = await faceapi.detectAllFaces(
            img,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
          )

          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Canvas context initialization failed."))
            return
          }

          // Target output is a 600x600 square for premium avatar sizing
          const targetSize = 600
          canvas.width = targetSize
          canvas.height = targetSize

          if (detections && detections.length > 0) {
            onStatusChange?.("Face found! Aligning pass profile...")
            const { x, y, width, height } = detections[0].box

            // Face center coordinates
            const cx = x + width / 2
            const cy = y + height / 2

            // Crop window size: scale bounding box 2.2x to capture face + hair + neck
            const maxDim = Math.max(width, height)
            let cropSize = maxDim * 2.2

            const limit = Math.min(img.width, img.height)
            if (cropSize > limit) {
              cropSize = limit
            }

            // Offset crop coordinates to center around cx, cy
            let cropX = cx - cropSize / 2
            let cropY = cy - cropSize / 2

            // Keep within horizontal boundaries
            if (cropX < 0) {
              cropX = 0
            } else if (cropX + cropSize > img.width) {
              cropX = img.width - cropSize
            }

            // Keep within vertical boundaries
            if (cropY < 0) {
              cropY = 0
            } else if (cropY + cropSize > img.height) {
              cropY = img.height - cropSize
            }

            ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, targetSize, targetSize)
            resolve({
              croppedImage: canvas.toDataURL("image/jpeg", 0.85),
              faceDetected: true,
            })
          } else {
            onStatusChange?.("No face detected. Applying center crop...")
            // Fallback: standard centered square crop
            const cropSize = Math.min(img.width, img.height)
            const cropX = (img.width - cropSize) / 2
            const cropY = (img.height - cropSize) / 2

            ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, targetSize, targetSize)
            resolve({
              croppedImage: canvas.toDataURL("image/jpeg", 0.85),
              faceDetected: false,
            })
          }
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        reject(new Error("Failed to parse optimized image element."))
      }
    } catch (err) {
      reject(err)
    }
  })
}
