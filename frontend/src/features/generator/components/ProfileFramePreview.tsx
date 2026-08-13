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
  position: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  builderId?: string
  isProcessing?: boolean
  logs?: string[]
}

export interface ProfileFramePreviewRef {
  download: () => Promise<void>
  getState: () => { zoom: number; position: { x: number; y: number } }
}

export const ProfileFramePreview = forwardRef<ProfileFramePreviewRef, ProfileFramePreviewProps>(
  ({ values, imageSrc, activeColor, zoom, onZoomChange, position, onPositionChange, builderId, isProcessing = false, logs = [] }, ref) => {
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
      onPositionChange(clampPosition(position.x, position.y, nextZoom))
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
      onPositionChange(clampPosition(rawX, rawY, zoom))
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
        onPositionChange(clampPosition(rawX, rawY, zoom))
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    // SVG markup generator for the high-res redesigned structure
    const getSvgInnerContent = (themeColor: string, roleName: string) => {
      // Escape variables for XSS protection
      const safeRole = escapeHtml(roleName)
      
      if (values.frameStyle === "goa-builder") {
        return `
          <defs>
            <!-- Mask to clear central cutout -->
            <mask id="cutout">
              <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
              <circle cx="50" cy="50" r="31" fill="#000000" />
            </mask>

            <!-- Subtle Paper Texture Filter -->
            <filter id="paper-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>

            <style>
              .goa-title {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                font-weight: 900;
              }
              .goa-sans {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              }
            </style>
          </defs>

          <!-- 1. Round base wrapper inside a circle border -->
          <!-- Circular card body with central cutout -->
          <g mask="url(#cutout)">
            <!-- Cream circle base -->
            <circle cx="50" cy="50" r="48" fill="#F4EFE4" />
            
            <!-- Texture overlay -->
            <circle cx="50" cy="50" r="48" filter="url(#paper-texture)" opacity="0.6" />

            <!-- Sunset and ocean on the left -->
            <circle cx="25" cy="46" r="12" fill="#F7C32E" opacity="0.9" />
            <path d="M 5,52 Q 15,48 25,52 T 48,51 L 48,65 L 5,65 Z" fill="#1E4D39" opacity="0.2" />
            <path d="M 5,54 Q 16,50 27,54 T 48,53 L 48,65 L 5,65 Z" fill="#1E4D39" opacity="0.35" />
            
            <!-- Fort silhouette -->
            <path d="M 16,53 L 16,45 L 20,45 L 20,42 L 18,42 L 18,39 L 21,39 L 21,53 Z" fill="#0F2A21" opacity="0.85" />
            <path d="M 10,55 Q 15,50 25,52 T 34,55 Z" fill="#0F2A21" />

            <!-- Left Palm tree -->
            <path d="M 12,65 C 18,52 15,35 9,25" fill="none" stroke="#1E4D39" stroke-width="1.2" stroke-linecap="round" />
            <path d="M 9,25 Q 16,21 21,23 Q 14,27 9,25" fill="#1E4D39" />
            <path d="M 9,25 Q 3,19 -3,22 Q 2,26 9,25" fill="#1E4D39" />
            <path d="M 9,25 Q 8,32 7,37 Q 9,31 9,25" fill="#1E4D39" />

            <!-- Faint foliage on the right -->
            <path d="M 88,55 C 80,42 82,25 88,15" fill="none" stroke="#1E4D39" stroke-width="0.8" stroke-dasharray="1 1" opacity="0.3" />
            <path d="M 88,15 Q 81,11 74,13 Q 80,17 88,15" fill="#1E4D39" opacity="0.3" />
          </g>

          <!-- 2. Outer forest green circle border -->
          <circle cx="50" cy="50" r="48" fill="none" stroke="#1E4D39" stroke-width="0.8" />

          <!-- 3. Top Title and Goa Stamp -->
          <g transform="translate(50, 14)">
            <text fill="#0F2A21" font-size="4.8" font-weight="900" text-anchor="middle" class="goa-title" letter-spacing="-0.01">HACKER HOUSE</text>
          </g>
          <g transform="translate(48, 17)">
            <text fill="#1E4D39" font-size="1.5" font-weight="900" text-anchor="middle" class="goa-sans" letter-spacing="0.12">BUILD • BREAK • INNOVATE</text>
          </g>
          
          <!-- Goa Badge -->
          <g transform="translate(73.5, 9.5) rotate(-6)">
            <rect x="0" y="0" width="7" height="3" rx="0.8" fill="#F7C32E" stroke="#E53E3E" stroke-width="0.25" />
            <text x="3.5" y="2.2" fill="#E53E3E" font-size="1.8" font-weight="900" class="goa-sans" text-anchor="middle">गोवा</text>
          </g>

          <!-- 4. Cutout border rings -->
          <circle cx="50" cy="50" r="32.4" fill="none" stroke="#1E4D39" stroke-width="0.8" />
          <circle cx="50" cy="50" r="31.8" fill="none" stroke="#F7C32E" stroke-width="0.6" />
          <circle cx="50" cy="50" r="31.3" fill="none" stroke="#E53E3E" stroke-width="0.4" />

          <!-- 5. Side Icons on the Right -->
          <g transform="translate(95, 29)" fill="#1E4D39" class="goa-sans">
            <!-- Code icon -->
            <text x="0" y="0" font-size="2.6" font-weight="900" text-anchor="middle">&lt;/&gt;</text>
            
            <!-- Light bulb icon path -->
            <g transform="translate(-2, 4) scale(0.18)" fill="#1E4D39">
              <path d="M9 21h6v1H9v-1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.65 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.65-.8 3.16-2.15 4.1z" />
            </g>
            
            <!-- Palm tree icon path -->
            <g transform="translate(-2, 11) scale(0.18)" fill="#1E4D39">
              <path d="M12 22V10m0 0a8 8 0 018-2c0 2-4 2-8 2m0 0a8 8 0 00-8-2c0 2 4 2 8 2m0 0a5 5 0 014-4m-4 4a5 5 0 00-4-4" />
            </g>
          </g>

          <!-- 6. Builder Brush Stroke Badge at the Bottom -->
          <g transform="translate(50, 87)">
            <!-- Brush stroke SVG path centered -->
            <path d="M -30,-4 C -12,-3 12,-5 30,-4 C 34,-3.8 38,-4.2 39,-3.5 C 36,-1.5 28,1 20,0.5 C 10,1 -10,0 -24,-0.5 C -28,-0.8 -32,-1.5 -31,-2.5 Z" fill="#0F2A21" />
            <text fill="#ffffff" font-size="2.6" font-weight="900" text-anchor="middle" class="goa-sans" letter-spacing="0.18" y="-0.5">${safeRole}</text>
          </g>
        `
      }

      if (values.frameStyle === "goa-classic") {
        const safeName = escapeHtml((values.name || "YOUR NAME").toUpperCase())
        const safeGithub = escapeHtml(values.github || "hacker")
        const safeTitle = escapeHtml(values.title || "Hacker")
        const safeStack = escapeHtml(values.techStack || "Backend Dev")

        return `
          <defs>
            <!-- Mask to clear central cutout -->
            <mask id="cutout">
              <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
              <circle cx="50" cy="50" r="31" fill="#000000" />
            </mask>

            <!-- Subtle Paper Texture Filter -->
            <filter id="paper-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>

            <!-- Fonts embedded for local canvas generation -->
            <style>
              .goa-title {
                font-family: 'Playfair Display', Georgia, serif;
                font-weight: 800;
              }
              .goa-sans {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              }
              .goa-mono {
                font-family: 'JetBrains Mono', monospace;
              }
            </style>
          </defs>

          <!-- 1. Background (warm ivory/cream) with cutout -->
          <g mask="url(#cutout)">
            <!-- Cream Base -->
            <rect x="0" y="0" width="100" height="100" fill="#FAF7F2" />
            
            <!-- Paper/Grain Texture overlay -->
            <rect x="0" y="0" width="100" height="100" filter="url(#paper-texture)" opacity="0.6" />

            <!-- Goa tropical elements behind the avatar cutout -->
            <!-- Warm yellow sun -->
            <circle cx="50" cy="48" r="34" fill="#FFE5A3" opacity="0.3" />

            <!-- Left side: Coconut palm silhouette + waves -->
            <!-- Sea Waves -->
            <path d="M -10,72 Q 10,67 25,73 T 60,69" fill="none" stroke="#082A1C" stroke-width="0.3" opacity="0.2" />
            <path d="M -10,75 Q 12,70 28,76 T 60,72" fill="none" stroke="#082A1C" stroke-width="0.15" opacity="0.1" />
            
            <!-- Palms trunk -->
            <path d="M 3,74 C 7,65 5,55 -2,46" fill="none" stroke="#082A1C" stroke-width="0.8" opacity="0.25" />
            <path d="M 6,74 C 9,67 11,60 8,53" fill="none" stroke="#082A1C" stroke-width="0.5" opacity="0.2" />
            <!-- Palms leaves -->
            <path d="M -2,46 Q 3,42 8,44 Q 2,47 -2,46" fill="#082A1C" opacity="0.25" />
            <path d="M -2,46 Q -5,41 -9,43 Q -6,47 -2,46" fill="#082A1C" opacity="0.25" />
            <path d="M -2,46 Q -4,52 -6,56 Q -3,51 -2,46" fill="#082A1C" opacity="0.25" />
            <path d="M -2,46 Q 2,49 5,53 Q 1,48 -2,46" fill="#082A1C" opacity="0.25" />
            
            <path d="M 8,53 Q 12,49 16,51 Q 11,53 8,53" fill="#082A1C" opacity="0.2" />
            <path d="M 8,53 Q 5,49 2,51 Q 5,54 8,53" fill="#082A1C" opacity="0.2" />
            <path d="M 8,53 Q 7,58 6,62 Q 8,57 8,53" fill="#082A1C" opacity="0.2" />
            <path d="M 8,53 Q 11,56 13,59 Q 10,55 8,53" fill="#082A1C" opacity="0.2" />

            <!-- Right side: Lighthouse & house silhouette -->
            <path d="M 110,72 Q 95,68 85,73 T 60,70" fill="none" stroke="#082A1C" stroke-width="0.3" opacity="0.2" />
            
            <!-- Lighthouse tower -->
            <path d="M 88,72 L 85,53 L 83,53 L 82,72 Z" fill="#082A1C" opacity="0.15" />
            <rect x="82.5" y="51.5" width="2" height="1.5" fill="#082A1C" opacity="0.2" />
            <!-- Light beam -->
            <polygon points="83.5,52 -10,30 -10,20" fill="#FFE5A3" opacity="0.08" />
            <polygon points="83.5,52 110,40 110,35" fill="#FFE5A3" opacity="0.08" />
            <!-- Palm tree on right -->
            <path d="M 94,72 C 92,63 95,54 102,46" fill="none" stroke="#082A1C" stroke-width="0.7" opacity="0.2" />
            <path d="M 102,46 Q 97,42 92,44 Q 98,47 102,46" fill="#082A1C" opacity="0.2" />
            <path d="M 102,46 Q 105,41 109,43 Q 106,47 102,46" fill="#082A1C" opacity="0.2" />
            <path d="M 102,46 Q 104,52 106,56 Q 103,51 102,46" fill="#082A1C" opacity="0.2" />
            
            <!-- Small flying birds -->
            <path d="M 12,23 Q 14,21 16,23 Q 18,21 20,23" fill="none" stroke="#082A1C" stroke-width="0.25" opacity="0.2" />
            <path d="M 15,26 Q 16.5,24.5 18,26 Q 19.5,24.5 21,26" fill="none" stroke="#082A1C" stroke-width="0.25" opacity="0.2" />
          </g>

          <!-- 2. Outer border and corners -->
          <rect x="2.5" y="2.5" width="95" height="95" rx="3.5" fill="none" stroke="#082A1C" stroke-width="0.4" />
          
          <!-- 3. Top Header Typography and details -->
          <!-- Top Left Label -->
          <text x="6" y="8" fill="#D92B5A" font-size="1.6" font-weight="800" class="goa-sans" letter-spacing="0.05">28–31 OCT • GOA</text>
          
          <!-- Top Right Label -->
          <text x="94" y="8" fill="#D92B5A" font-size="1.6" font-weight="800" class="goa-sans" text-anchor="end" letter-spacing="0.05">HH GOA • 2026</text>

          <!-- Top Main Title: HACKER HOUSE -->
          <g transform="translate(50, 16.5)">
            <text fill="#082A1C" font-size="6.2" font-weight="900" text-anchor="middle" class="goa-title" letter-spacing="0.02">HACKER HOUSE</text>
          </g>

          <!-- Tilted "LET'S BUILD" stamp top-left -->
          <g transform="translate(7.5, 12.5) rotate(-8)">
            <rect x="0" y="0" width="10.5" height="4.5" rx="0.5" fill="#FFE5A3" stroke="#082A1C" stroke-width="0.3" />
            <text x="5.25" y="3.3" fill="#082A1C" font-size="1.6" font-weight="950" class="goa-sans" text-anchor="middle" letter-spacing="0.02">LET'S BUILD!</text>
          </g>

          <!-- "गोवा" (Goa) badge next to HACKER HOUSE -->
          <g transform="translate(82.5, 12.5)">
            <rect x="0" y="0" width="11" height="4.8" rx="1.2" fill="#FFE5A3" stroke="#D92B5A" stroke-width="0.3" />
            <text x="5.5" y="3.6" fill="#D92B5A" font-size="2.6" font-weight="900" class="goa-sans" text-anchor="middle">गोवा</text>
          </g>

          <!-- 4. Photo circular border rings -->
          <!-- Outer: thin dark forest green -->
          <circle cx="50" cy="50" r="32.4" fill="none" stroke="#082A1C" stroke-width="0.4" />
          <!-- Middle: bright yellow ring -->
          <circle cx="50" cy="50" r="31.8" fill="none" stroke="#FFE358" stroke-width="0.6" />
          <!-- Inner: pink accent ring -->
          <circle cx="50" cy="50" r="31.3" fill="none" stroke="#D92B5A" stroke-width="0.4" />

          <!-- 5. Builder Badge (lower-left edge of photo cutout) -->
          <g transform="translate(19, 70.5) rotate(-6)">
            <!-- Forest green card edge styling -->
            <rect x="0" y="0" width="17" height="5.2" rx="1.2" fill="#FAF7F2" stroke="#082A1C" stroke-width="0.4" />
            <rect x="0.6" y="0.6" width="15.8" height="4.0" rx="0.8" fill="#FFE5A3" />
            <text x="8.5" y="3.4" fill="#082A1C" font-size="2.2" font-weight="950" class="goa-sans" text-anchor="middle" letter-spacing="0.06">${safeRole}</text>
          </g>

          <!-- 6. Bottom credentials stamp-style ticket card -->
          <g transform="translate(8, 73.5)">
            <!-- Ticket background with scalloped edge cuts -->
            <rect x="0" y="0" width="84" height="21.5" rx="2" fill="#FFFFFF" stroke="#082A1C" stroke-width="0.3" />
            
            <!-- Side punches -->
            <circle cx="0" cy="10.75" r="1.6" fill="#FAF7F2" stroke="#082A1C" stroke-width="0.3" />
            <circle cx="84" cy="10.75" r="1.6" fill="#FAF7F2" stroke="#082A1C" stroke-width="0.3" />
            <circle cx="0" cy="10.75" r="1.45" fill="#FAF7F2" />
            <circle cx="84" cy="10.75" r="1.45" fill="#FAF7F2" />

            <!-- "NAME" Label -->
            <text x="4.5" y="3.2" fill="#082A1C" font-size="1.2" font-weight="900" class="goa-sans" opacity="0.6" letter-spacing="0.05">NAME</text>

            <!-- Name Yellow Pill -->
            <rect x="4.5" y="4.4" width="53.5" height="5.2" rx="1" fill="#FFD43B" />
            <text x="31.25" y="8.2" fill="#082A1C" font-size="3.2" font-weight="950" class="goa-sans" text-anchor="middle" letter-spacing="0.02">${safeName}</text>

            <!-- GitHub badge pill -->
            <rect x="59.5" y="4.4" width="20" height="5.2" rx="2.6" fill="#082A1C" />
            <text x="69.5" y="7.9" fill="#FFFFFF" font-size="2.0" font-weight="800" class="goa-sans" text-anchor="middle">@${safeGithub}</text>

            <!-- Divider Line between Name Row and Details Row -->
            <line x1="4.5" y1="10.6" x2="79.5" y2="10.6" stroke="#082A1C" stroke-width="0.15" opacity="0.15" />

            <!-- Details Row (STACK and TITLE) -->
            <!-- STACK Column -->
            <text x="4.5" y="12.8" fill="#082A1C" font-size="1.2" font-weight="900" class="goa-sans" opacity="0.6" letter-spacing="0.05">STACK</text>
            <text x="4.5" y="15.8" fill="#082A1C" font-size="2.4" font-weight="800" class="goa-sans">${safeStack}</text>

            <!-- Vertical Separator -->
            <line x1="43" y1="11.8" x2="43" y2="16.2" stroke="#082A1C" stroke-width="0.2" opacity="0.2" />

            <!-- TITLE Column -->
            <text x="45.5" y="12.8" fill="#082A1C" font-size="1.2" font-weight="900" class="goa-sans" opacity="0.6" letter-spacing="0.05">TITLE</text>
            <text x="45.5" y="15.8" fill="#082A1C" font-size="2.4" font-weight="800" class="goa-sans">${safeTitle}</text>

            <!-- Divider Line between Details Row and Barcode/Pin Row -->
            <line x1="4.5" y1="17.0" x2="79.5" y2="17.0" stroke="#082A1C" stroke-width="0.15" opacity="0.15" />

            <!-- Barcode Overlay and Coordinates -->
            <!-- Minimal Vector Barcode -->
            <g transform="translate(4.5, 17.8)">
              <rect x="0" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="0.6" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="1.0" y="0" width="0.4" height="1.8" fill="#082A1C" />
              <rect x="1.7" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="2.1" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="2.4" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="3.0" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="3.3" y="0" width="0.5" height="1.8" fill="#082A1C" />
              <rect x="4.1" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="4.5" y="0" width="0.3" height="1.8" fill="#082A1C" />
              
              <rect x="5.3" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="5.7" y="0" width="0.4" height="1.8" fill="#082A1C" />
              <rect x="6.4" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="6.7" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="7.3" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="7.6" y="0" width="0.5" height="1.8" fill="#082A1C" />
              <rect x="8.4" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="8.8" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="9.4" y="0" width="0.1" height="1.8" fill="#082A1C" />
              
              <rect x="10.0" y="0" width="0.4" height="1.8" fill="#082A1C" />
              <rect x="10.7" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="11.1" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="11.4" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="12.0" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="12.3" y="0" width="0.5" height="1.8" fill="#082A1C" />
              <rect x="13.1" y="0" width="0.2" height="1.8" fill="#082A1C" />
              <rect x="13.5" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="14.1" y="0" width="0.1" height="1.8" fill="#082A1C" />

              <rect x="14.6" y="0" width="0.4" height="1.8" fill="#082A1C" />
              <rect x="15.2" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="15.5" y="0" width="0.3" height="1.8" fill="#082A1C" />
              <rect x="16.0" y="0" width="0.1" height="1.8" fill="#082A1C" />
              <rect x="16.3" y="0" width="0.5" height="1.8" fill="#082A1C" />
              <text x="8.5" y="2.7" fill="#082A1C" font-size="0.8" class="goa-mono" text-anchor="middle" opacity="0.6">${escapeHtml(builderId || "HHGOA26-BUILDER-1947")}</text>
            </g>

            <!-- Location PIN Icon and Coordinates in right bottom -->
            <g transform="translate(48, 17.5)">
              <path d="M2.5,0 C1.1,0 0,1.1 0,2.5 C0,4.4 2.5,7 2.5,7 C2.5,7 5,4.4 5,2.5 C5,1.1 3.9,0 2.5,0 Z M2.5,3.5 C1.9,3.5 1.5,3.1 1.5,2.5 C1.5,1.9 1.9,1.5 2.5,1.5 C3.1,1.5 3.5,1.9 3.5,2.5 C3.5,3.1 3.1,3.5 2.5,3.5 Z" fill="#D92B5A" transform="scale(0.32)" />
              <text x="2.2" y="1.8" fill="#082A1C" font-size="1.1" font-weight="900" class="goa-sans" opacity="0.6" letter-spacing="0.02">15.2993° N, 74.1240° E</text>
              <text x="2.2" y="3.0" fill="#082A1C" font-size="1.1" font-weight="900" class="goa-sans" opacity="0.6" letter-spacing="0.02">GOA, INDIA</text>
            </g>

            <!-- Buttons: VIEW SCHEDULE and CONNECT details -->
            <g transform="translate(68.5, 17.5)">
              <text x="11" y="1.5" fill="#082A1C" font-size="1.2" font-weight="bold" class="goa-sans" text-anchor="end" opacity="0.4">VIEW SCHEDULE</text>
              <text x="11" y="2.7" fill="#082A1C" font-size="1.2" font-weight="bold" class="goa-sans" text-anchor="end" opacity="0.4">CONNECT</text>
            </g>
          </g>
        `
      }

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
            className={`absolute rounded-full overflow-hidden z-0 transition-colors duration-300 ${
              values.frameStyle === "goa-builder" ? "bg-[#F4EFE4]" : values.frameStyle === "goa-classic" ? "bg-[#FAF7F2]" : "bg-[#050807]"
            }`}
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
              values.frameStyle === "goa-builder" || values.frameStyle === "goa-classic" ? (
                <div className="w-full h-full bg-[#FAF7F2] flex flex-col items-center justify-center text-[#1E4D39]/50">
                  <div className="h-9 w-9 rounded-full border border-[#1E4D39]/10 flex items-center justify-center bg-[#FAF7F2]/50 mb-1.5">
                    <svg className="h-5 w-5 text-[#1E4D39]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-[8px] uppercase font-black tracking-widest font-heading text-[#1E4D39]/50">
                    YOUR PHOTO
                  </span>
                </div>
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
              )
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
