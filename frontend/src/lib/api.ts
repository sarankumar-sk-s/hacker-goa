const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

export interface UploadResponse {
  id: string
  url: string
}

export interface GenerationResponse {
  id: string
  url: string
  image_base64: string
}

export interface ShareResponse {
  share_id: string
  share_url: string
}

export const api = {
  /**
   * Upload user photo to storage
   */
  async uploadPhoto(blob: Blob): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append("file", blob, "avatar.png")

    const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to upload avatar image to the server.")
    }

    return res.json()
  },

  /**
   * Request ID card rendering
   */
  async generateBuilderCard(params: {
    image_id: string
    name: string
    role: string
    title: string
    tech_stack: string
    github?: string
    twitter?: string
    accent_color: string
    resolution: "1080p" | "4k"
  }): Promise<GenerationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/generate-builder-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to generate builder ID card.")
    }

    return res.json()
  },

  /**
   * Request profile frame rendering
   */
  async generateProfileFrame(params: {
    image_id: string
    accent_color: string
    role: string
    zoom: number
    x_offset: number
    y_offset: number
    resolution: "1080p" | "4k"
  }): Promise<GenerationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/generate-frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to generate profile frame overlay.")
    }

    return res.json()
  },

  /**
   * Register generated image for social sharing
   */
  async registerShare(imageId: string): Promise<ShareResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_id: imageId }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to generate shareable link.")
    }

    return res.json()
  },

  /**
   * Resolves absolute asset URL path from relative backend response paths
   */
  getAbsoluteUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith("http")) return relativeUrl
    const path = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`
    return `${API_BASE_URL}${path}`
  }
}
