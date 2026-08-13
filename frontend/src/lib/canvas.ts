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
  primaryColor: string,
  zoom?: number,
  position?: { x: number; y: number },
  previewSize?: number,
  builderId?: string
): Promise<void> {
  // Frame 3 — Hacker House Goa Builder ID Card Local Draw
  if (values.frameStyle === "goa-builder") {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1536
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not initialize canvas context.")

    // 1. Draw user photo inside the circular cutout first so background template is layered on top!
    // Circular cutout center is (512, 602), radius is 267
    ctx.save()
    ctx.beginPath()
    ctx.arc(512, 602, 267, 0, Math.PI * 2)
    ctx.clip()

    if (imageSrc) {
      try {
        const img = await loadImage(imageSrc)
        const baseScale = Math.max(534 / img.width, 534 / img.height)
        const finalScale = baseScale * (zoom || 1.0)
        const w = img.width * finalScale
        const h = img.height * finalScale

        const scaleFactor = 1024 / (previewSize || 300)
        const x = 512 - w / 2 + (position?.x || 0) * scaleFactor
        const y = 602 - h / 2 + (position?.y || 0) * scaleFactor

        ctx.drawImage(img, x, y, w, h)
      } catch (e) {
        ctx.fillStyle = "#F4EFE4"
        ctx.fillRect(512 - 267, 602 - 267, 534, 534)
      }
    } else {
      ctx.fillStyle = "#F4EFE4"
      ctx.fillRect(512 - 267, 602 - 267, 534, 534)
    }
    ctx.restore()

    // 2. Draw Goa Builder template background artwork
    const safeRole = escapeHtml((values.role || "BUILDER").toUpperCase())
    const formattedId = builderId 
      ? `HHG-26-${builderId.split("-").pop() || "0000"}` 
      : "HHG-26-0000"

    const backdropSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536" fill="none">
        <mask id="cutout">
          <rect x="0" y="0" width="1024" height="1536" fill="#ffffff" />
          <circle cx="512" cy="602" r="267" fill="#000000" />
        </mask>

        <filter id="paper-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>

        <g mask="url(#cutout)">
          <rect x="10" y="10" width="1004" height="1516" rx="80" fill="#F4EFE4" stroke="#1E4D39" stroke-width="8" />
          <rect x="14" y="14" width="996" height="1508" rx="76" filter="url(#paper-texture)" opacity="0.6" />

          <!-- Scenery -->
          <circle cx="170" cy="836" r="75" fill="#F7C32E" opacity="0.9" />
          <path d="M 14,920 Q 100,900 180,920 T 420,915 L 420,1000 L 14,1000 Z" fill="#1E4D39" opacity="0.2" />
          <path d="M 14,932 L 420,932 L 420,1000 L 14,1000 Z" fill="#1E4D39" opacity="0.35" />
          <path d="M 80,920 L 80,870 L 105,870 L 105,855 L 90,855 L 90,835 L 115,835 L 115,920 Z" fill="#0F2A21" opacity="0.85" />
          <path d="M 20,935 Q 50,915 120,920 T 180,935 Z" fill="#0F2A21" />

          <!-- Palms -->
          <path d="M 30,1000 C 70,915 50,750 15,630" stroke="#1E4D39" stroke-width="8.5" fill="none" stroke-linecap="round" />
          <path d="M 15,630 Q 60,605 95,620 Q 50,640 15,630" fill="#1E4D39" />
          <path d="M 15,630 Q -15,595 -50,610 Q -20,635 15,630" fill="#1E4D39" />
          <path d="M 15,630 Q 7,675 -3,710 Q 10,670 15,630" fill="#1E4D39" />
          <path d="M 15,630 Q 50,665 70,700 Q 40,660 15,630" fill="#1E4D39" />

          <path d="M 1010,1000 C 970,930 985,820 1010,720" stroke="#1E4D39" stroke-width="6" stroke-dasharray="5 5" fill="none" opacity="0.4" />
          <path d="M 1010,720 Q 975,700 940,715 M 1010,720 Q 1000,755 990,780" stroke="#1E4D39" stroke-width="5" opacity="0.4" />
        </g>

        <!-- Cutout Rings -->
        <circle cx="512" cy="602" r="280.5" fill="none" stroke="#1E4D39" stroke-width="8.5" />
        <circle cx="512" cy="602" r="273.5" fill="none" stroke="#F7C32E" stroke-width="6.8" />
        <circle cx="512" cy="602" r="267.0" fill="none" stroke="#E53E3E" stroke-width="5.0" />

        <!-- Side Icons -->
        <g transform="translate(896, 500)" fill="#1E4D39">
          <text x="0" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-size="44" font-weight="900" text-anchor="middle">&lt;/&gt;</text>
          <g transform="translate(-20, 60) scale(1.6)" fill="#1E4D39">
            <path d="M9 21h6v1H9v-1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.65 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.65-.8 3.16-2.15 4.1z" />
          </g>
          <g transform="translate(-20, 150) scale(1.6)" fill="#1E4D39">
            <path d="M12 22V10m0 0a8 8 0 018-2c0 2-4 2-8 2m0 0a8 8 0 00-8-2c0 2 4 2 8 2m0 0a5 5 0 014-4m-4 4a5 5 0 00-4-4" />
          </g>
        </g>

        <!-- Brush Badge Shape -->
        <g transform="translate(512, 888)">
          <path d="M -240,-15 C -90,-10 90,-18 240,-15 C 275,-14 315,-18 322,-12 C 300,-3 220,13 140,11 C 40,13 -100,5 -200,1 C -230,-0.5 -270,-3 -265,-8 Z" fill="#0F2A21" />
        </g>

        <!-- Bottom Panel & Icons -->
        <g transform="translate(10, 1176)">
          <rect x="0" y="0" width="1004" height="340" fill="#0F2A21" />
          <rect x="0" y="0" width="401.6" height="8.5" fill="#1E4D39" />
          <rect x="401.6" y="0" width="301.2" height="8.5" fill="#F7C32E" />
          <rect x="702.8" y="0" width="301.2" height="8.5" fill="#E53E3E" />
          
          <g transform="translate(780, 80) scale(3)" stroke="#F4EFE4" stroke-width="1.2" fill="none" opacity="0.25">
            <path d="M 30 10 L 30 18 M 27 13 L 33 13 M 30 18 L 22 25 L 22 45 L 38 45 L 38 25 Z" />
            <path d="M 26 30 L 34 30 M 30 27 L 30 35" />
            <path d="M 45 45 C 47 38 45 32 40 28 M 40 28 Q 48 26 53 28 M 40 28 Q 42 34 44 40" />
          </g>

          <!-- Pin -->
          <path d="M 245,126 A 10,10 0 0,1 255,116 A 10,10 0 0,1 265,126 C 265,134 255,144 255,144 C 255,144 245,134 245,126 Z M 251,126 A 4,4 0 0,0 255,130 A 4,4 0 0,0 259,126 A 4,4 0 0,0 255,122 A 4,4 0 0,0 251,126 Z" fill="#F7C32E" />
        </g>
      </svg>
    `

    try {
      const bgImg = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(backdropSvg))
      ctx.drawImage(bgImg, 0, 0, 1024, 1536)
    } catch (e) {
      console.error("Failed to load Frame 3 backdrop:", e)
    }

    // 3. Draw dynamic header texts
    ctx.fillStyle = "#1E4D39"
    ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("28 – 31 OCT • GOA", 68, 48)

    ctx.textAlign = "right"
    ctx.fillText("HH GOA • 2026", 956, 48)

    // Hacker House title
    ctx.fillStyle = "#0F2A21"
    ctx.font = "900 84px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("HACKER HOUSE", 68, 100)

    // Subtitle BUILD • BREAK • INNOVATE
    ctx.fillStyle = "#1E4D39"
    ctx.font = "900 22px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("BUILD", 68, 205)
    ctx.fillStyle = "#F7C32E"
    ctx.fillText("•", 152, 205)
    ctx.fillStyle = "#1E4D39"
    ctx.fillText("BREAK", 175, 205)
    ctx.fillStyle = "#E53E3E"
    ctx.fillText("•", 267, 205)
    ctx.fillStyle = "#1E4D39"
    ctx.fillText("INNOVATE", 290, 205)

    // Tilted Goa badge
    ctx.save()
    ctx.translate(765, 142)
    ctx.rotate(-8 * Math.PI / 180)
    ctx.fillStyle = "#F7C32E"
    ctx.strokeStyle = "#E53E3E"
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(-42, -22, 84, 44, 12)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = "#E53E3E"
    ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("गोवा", 0, 2)
    ctx.restore()

    // 4. Draw dynamic Role text in white centered inside brush stroke
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "900 36px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(safeRole, 512, 888)

    // 5. Draw Name, GitHub username, and BUILDER ID Label and generated value
    // Draw Name
    ctx.fillStyle = "#0F2A21"
    ctx.font = "900 42px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText((values.name || "YOUR NAME").toUpperCase(), 512, 1003)

    // Draw GitHub ID
    ctx.fillStyle = "#E53E3E"
    ctx.font = "bold 26px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(`@${values.github || "username"}`, 512, 1048)

    // Draw BUILDER ID Label
    ctx.fillStyle = "#1E4D39"
    ctx.font = "900 20px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText("BUILDER ID", 512, 1105)

    // Draw BUILDER ID Value
    ctx.fillStyle = "#0F2A21"
    ctx.font = "900 34px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(formattedId, 512, 1132)

    // 6. Draw QR code
    try {
      const qrImg = await loadImage("/qr_hhgoa.png")
      ctx.drawImage(qrImg, 68, 1285, 172, 172)
    } catch (e) {
      console.error("Failed to load QR code for canvas:", e)
    }

    // 7. Draw Metadata coordinates texts inside bottom panel — only GOA, INDIA
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "900 28px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("GOA, INDIA", 295, 1340)

    // 8. Trigger download
    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `HH_Goa_Builder_Card_${values.name.replace(/\s+/g, "_") || "2026"}.png`
    link.href = dataUrl
    link.click()
    return
  }

  // Goa Heritage Template Local Draw
  if (values.frameStyle === "goa-classic") {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1536
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not initialize canvas context.")

    // 1. Draw user photo inside the circular cutout first so background template is layered on top!
    // Circular cutout center is (512, 602), radius is 267
    ctx.save()
    ctx.beginPath()
    ctx.arc(512, 602, 267, 0, Math.PI * 2)
    ctx.clip()

    if (imageSrc) {
      try {
        const img = await loadImage(imageSrc)
        const baseScale = Math.max(534 / img.width, 534 / img.height)
        const finalScale = baseScale * (zoom || 1.0)
        const w = img.width * finalScale
        const h = img.height * finalScale

        const scaleFactor = 1024 / (previewSize || 300)
        const x = 512 - w / 2 + (position?.x || 0) * scaleFactor
        const y = 602 - h / 2 + (position?.y || 0) * scaleFactor

        ctx.drawImage(img, x, y, w, h)
      } catch (e) {
        ctx.fillStyle = "#EAE3D2"
        ctx.fillRect(512 - 267, 602 - 267, 534, 534)
      }
    } else {
      ctx.fillStyle = "#EAE3D2"
      ctx.fillRect(512 - 267, 602 - 267, 534, 534)
    }
    ctx.restore()

    // 2. Draw Goa Heritage template background (contains borders, scenery, buttons, etc.) on top
    try {
      const bgImg = await loadImage("/goa_heritage_bg.png")
      ctx.drawImage(bgImg, 0, 0, 1024, 1536)
    } catch (e) {
      console.error("Failed to load /goa_heritage_bg.png for canvas:", e)
    }

    // 3. Draw dynamic Pink Role Badge (rotates -6deg, centered around x=297, y=775)
    ctx.save()
    ctx.translate(297, 775)
    ctx.rotate(-6 * Math.PI / 180)
    
    // Draw badge background
    ctx.fillStyle = "#D92B5A"
    ctx.strokeStyle = "#0B3F20"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(-88, -32, 176, 64, 12)
    ctx.fill()
    ctx.stroke()
    
    // Draw badge text
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText((values.role || "BUILDER").toUpperCase(), 0, 2)
    ctx.restore()

    // 4. Draw dynamic Name inside yellow name box (centered horizontally, y=990)
    ctx.fillStyle = "#0B3F20"
    ctx.font = "900 38px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText((values.name || "YOUR NAME").toUpperCase(), 430, 990) // Yellow box center x: (157+705)/2 = 431

    // 5. Draw dynamic Username inside green pill (centered horizontally inside green pill: center x=795, y=990)
    if (values.github) {
      ctx.fillStyle = "#FCD205"
      ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`@${values.github}`, 795, 990)
    }

    // 6. Draw dynamic Stack column text (left-aligned at x=140, y=1080)
    ctx.fillStyle = "#0B3F20"
    ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(values.techStack || "Backend Dev", 140, 1080)

    // 7. Draw dynamic Designation/Title column text (left-aligned at x=540, y=1080)
    ctx.fillStyle = "#0B3F20"
    ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(values.title || "Hacker", 540, 1080)

    // 8. Draw dynamic Barcode Stripes (starts at x=264, width=502, y=1180, height=99)
    ctx.fillStyle = "#0B3F20"
    const barcodeX = 264
    const barcodeY = 1180
    const barcodeWidth = 502
    const barcodeHeight = 99
    
    // Draw stripes seeded by builderId
    const idStr = builderId || "HHGOA26-BUILDER-1947"
    let seed = 0
    for (let c of idStr) seed += c.charCodeAt(0)
    
    let currX = barcodeX
    while (currX < barcodeX + barcodeWidth - 10) {
      const stripeW = ((seed % 3) + 1) * 4
      ctx.fillRect(currX, barcodeY, stripeW, barcodeHeight)
      seed = (seed * 9301 + 49297) % 233280
      const gapW = ((seed % 3) + 1) * 4
      currX += stripeW + gapW
    }

    // 9. Draw dynamic Builder ID text below barcode (centered horizontally, y=1290)
    ctx.fillStyle = "#0B3F20"
    ctx.font = "bold 24px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(idStr, 512, 1290)

    // 10. Center new pink QR code image in Left Button & Coordinates in Right Button
    // Cover the left button rectangle box on the canvas
    ctx.fillStyle = "#FAF7F2"
    ctx.fillRect(166, 1350, 332, 86)

    try {
      const qrImg = await loadImage("/qr_hhgoa.png")
      ctx.drawImage(qrImg, 284, 1345, 96, 96)
    } catch (e) {
      console.error("Failed to load /qr_hhgoa.png for canvas:", e)
    }

    ctx.save()
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillStyle = "#0B3F20"

    // Draw centered Line 1: VIEW : 15.2993° N, 74.1240° E
    ctx.font = "900 16px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText("VIEW : 15.2993° N, 74.1240° E", 683, 1367)

    // Draw centered Line 2: GOA, INDIA
    ctx.font = "900 17px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText("GOA, INDIA", 683, 1393)
    ctx.restore()

    // Trigger download of canvas
    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `HH_Goa_Builder_Card_${values.name.replace(/\s+/g, "_") || "2026"}.png`
    link.href = dataUrl
    link.click()
    return
  }

  // Cyberpunk Template Local Draw (Fallback / client-side render)
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
