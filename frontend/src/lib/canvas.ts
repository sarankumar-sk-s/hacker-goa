import type { GeneratorFormValues } from "../types"
import { escapeHtml } from "./utils"

/**
 * Promise wrapper to load image assets cleanly
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = src
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image asset: ${src}`))
  })
}

/**
 * Shared service to draw and trigger downloads for Builder Cards
 */
export async function downloadBuilderCard(
  imageSrc: string | null,
  values: GeneratorFormValues,
  primaryColor: string
): Promise<void> {
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 1800
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not initialize canvas context.")

  // 1. Draw Background (WebP optimized)
  try {
    const bgImg = await loadImage("/goa_cyberpunk_badge_bg.webp")
    ctx.drawImage(bgImg, 0, 0, 1200, 1800)
  } catch (e) {
    // Fallback gradient if file fails to load
    const grad = ctx.createRadialGradient(600, 300, 50, 600, 900, 1000)
    grad.addColorStop(0, primaryColor + "1A")
    grad.addColorStop(0.5, "#0A0A0C")
    grad.addColorStop(1, "#050507")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1200, 1800)
  }

  // Cinematic dark gradients overlay
  const centerGrad = ctx.createRadialGradient(600, 570, 200, 600, 570, 700)
  centerGrad.addColorStop(0, "rgba(5, 5, 7, 0.95)")
  centerGrad.addColorStop(0.5, "rgba(5, 5, 7, 0.7)")
  centerGrad.addColorStop(1, "rgba(5, 5, 7, 0.4)")
  ctx.fillStyle = centerGrad
  ctx.fillRect(0, 0, 1200, 1800)

  const bottomGrad = ctx.createLinearGradient(0, 1800, 0, 1000)
  bottomGrad.addColorStop(0, "rgba(5, 5, 7, 0.95)")
  bottomGrad.addColorStop(0.5, "rgba(5, 5, 7, 0.6)")
  bottomGrad.addColorStop(1, "rgba(5, 5, 7, 0.0)")
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, 1000, 1200, 800)

  // Glow tint
  ctx.save()
  ctx.globalCompositeOperation = "color-dodge"
  const themeGrad = ctx.createRadialGradient(600, 540, 50, 600, 540, 600)
  themeGrad.addColorStop(0, primaryColor + "4D")
  themeGrad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = themeGrad
  ctx.fillRect(0, 0, 1200, 1800)
  ctx.restore()

  // 2. Draw outer borders
  ctx.strokeStyle = primaryColor + "33"
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.roundRect(40, 40, 1120, 1720, 40)
  ctx.stroke()

  // 3. Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)"
  ctx.lineWidth = 2
  for (let i = 80; i < 1120; i += 80) {
    ctx.beginPath(); ctx.moveTo(i, 40); ctx.lineTo(i, 1760); ctx.stroke()
  }
  for (let j = 80; j < 1720; j += 80) {
    ctx.beginPath(); ctx.moveTo(40, j); ctx.lineTo(1160, j); ctx.stroke()
  }

  // 4. Header details
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 44px sans-serif"
  ctx.fillText("HACKER HOUSE GOA 2026", 100, 150)

  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "32px sans-serif"
  ctx.fillText("BUILDER PASS", 100, 210)

  ctx.fillStyle = primaryColor
  ctx.fillRect(100, 240, 1000, 6)

  // 5. Draw Avatar
  const avatarSize = 500
  const avatarX = 350
  const avatarY = 320

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 30)
  ctx.clip()

  if (imageSrc) {
    try {
      const img = await loadImage(imageSrc)
      const scale = Math.max(avatarSize / img.width, avatarSize / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = avatarX + (avatarSize - w) / 2
      const y = avatarY + (avatarSize - h) / 2
      ctx.drawImage(img, x, y, w, h)
    } catch (e) {
      drawAvatarPlaceholder(ctx, avatarX, avatarY, avatarSize)
    }
  } else {
    drawAvatarPlaceholder(ctx, avatarX, avatarY, avatarSize)
  }
  ctx.restore()

  // Avatar border
  ctx.strokeStyle = primaryColor + "66"
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 30)
  ctx.stroke()

  // 6. Draw User details
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 72px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(values.name || "YOUR NAME", 600, 930)

  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.font = "40px sans-serif"
  ctx.fillText(values.title || "Builder & Hacker", 600, 1000)

  // Role badge pill
  const roleText = (values.role || "BUILDER").toUpperCase()
  ctx.font = "bold 32px sans-serif"
  const textWidth = ctx.measureText(roleText).width
  const badgeW = textWidth + 80
  const badgeH = 70
  const badgeX = 600 - badgeW / 2
  const badgeY = 1050

  ctx.fillStyle = primaryColor + "1A"
  ctx.strokeStyle = primaryColor + "33"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = primaryColor
  ctx.fillText(roleText, 600, badgeY + 46)

  // Tech stack
  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "32px monospace"
  ctx.fillText((values.techStack || "TypeScript, React, Rust").toUpperCase(), 600, 1210)

  // Coordinates Divider
  ctx.strokeStyle = "rgba(255,255,255,0.05)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, 1310)
  ctx.lineTo(1100, 1310)
  ctx.stroke()

  ctx.textAlign = "left"
  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.font = "36px monospace"
  ctx.fillText(`GH: @${values.github || "hacker"}`, 150, 1390)
  ctx.fillText(`TW: @${values.twitter || "hacker"}`, 150, 1460)

  ctx.textAlign = "right"
  ctx.fillText("GOA, INDIA", 1050, 1390)
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
  ctx.font = "28px monospace"
  ctx.fillText("15.2993° N, 74.1240° E", 1050, 1450)

  // Barcode
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
  const barcodeX = 300
  const barcodeY = 1560
  const barcodeH = 100
  for (let i = 0; i < 600; i += 10) {
    const width = i % 30 === 0 ? 6 : i % 20 === 0 ? 4 : 2
    ctx.fillRect(barcodeX + i, barcodeY, width, barcodeH)
  }

  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
  ctx.font = "24px monospace"
  ctx.fillText("HHG-2026-BUILDER-VERIFIED", 600, 1700)

  // Trigger download
  const dataUrl = canvas.toDataURL("image/png")
  const link = document.createElement("a")
  link.download = `HH_Goa_Builder_Card_${values.name.replace(/\s+/g, "_") || "2026"}.png`
  link.href = dataUrl
  link.click()
}

/**
 * Shared service to draw and trigger downloads for Profile Frames
 */
export async function downloadProfileFrame(
  imageSrc: string | null,
  values: GeneratorFormValues,
  zoom: number,
  position: { x: number; y: number },
  previewSize: number,
  activeColor: string,
  getSvgInnerContent: (themeColor: string, roleName: string) => string
): Promise<void> {
  const size = 1080
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not initialize canvas context.")

  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, 32)
  ctx.clip()

  // 1. Draw avatar inside circular cutout area (cx=540, cy=540, r=334.8)
  ctx.save()
  ctx.beginPath()
  ctx.arc(540, 540, 334.8, 0, Math.PI * 2)
  ctx.clip()

  if (imageSrc) {
    try {
      const img = await loadImage(imageSrc)
      const baseScale = Math.max(669.6 / img.width, 669.6 / img.height)
      const finalScale = baseScale * zoom
      const w = img.width * finalScale
      const h = img.height * finalScale

      const scaleFactor = 1080 / previewSize
      const x = 540 - w / 2 + position.x * scaleFactor
      const y = 540 - h / 2 + position.y * scaleFactor

      ctx.drawImage(img, x, y, w, h)
    } catch (e) {
      drawFramePlaceholder(ctx, size)
    }
  } else {
    drawFramePlaceholder(ctx, size)
  }
  ctx.restore()

  // 2. Render SVG overlay on top (with HTML parameter sanitization)
  const escapedRole = escapeHtml((values.role || "BUILDER").toUpperCase())
  const svgInner = getSvgInnerContent(activeColor, escapedRole)
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1080" height="1080">
    <style>
      .font-heading { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 900; }
    </style>
    ${svgInner}
  </svg>`

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)
  
  try {
    const overlayImg = await loadImage(url)
    ctx.drawImage(overlayImg, 0, 0, 1080, 1080)
  } catch (err) {
    console.error("Failed to load SVG overlay for canvas:", err)
  } finally {
    URL.revokeObjectURL(url)
  }

  // 3. Trigger download
  const dataUrl = canvas.toDataURL("image/png")
  const link = document.createElement("a")
  link.download = `HH_Goa_Profile_Frame_${values.name.replace(/\s+/g, "_") || "2026"}.png`
  link.href = dataUrl
  link.click()
}

// Helpers for canvas drawing
function drawAvatarPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const imgGrad = ctx.createLinearGradient(x, y, x + size, y + size)
  imgGrad.addColorStop(0, "#1F1F24")
  imgGrad.addColorStop(1, "#111113")
  ctx.fillStyle = imgGrad
  ctx.fillRect(x, y, size, size)
  
  ctx.strokeStyle = "rgba(255,255,255,0.15)"
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(x + 250, y + 200, 80, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + 250, y + 460, 160, Math.PI, Math.PI * 2)
  ctx.stroke()
}

function drawFramePlaceholder(ctx: CanvasRenderingContext2D, size: number) {
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, "#121214")
  grad.addColorStop(1, "#050507")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = "rgba(255,255,255,0.06)"
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(540, 540, 160, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(540, 980, 360, Math.PI, Math.PI * 2)
  ctx.stroke()
}
