from pydantic import BaseModel, Field
from typing import Optional


class UploadResponse(BaseModel):
    id: str = Field(..., description="Unique identifier of the uploaded image")
    url: str = Field(..., description="Download URL of the uploaded image")


class GenerateFrameRequest(BaseModel):
    image_id: str = Field(..., description="ID of the uploaded avatar image")
    accent_color: str = Field(default="neon-green", description="Accent color theme")
    role: str = Field(default="Builder", description="Hacker House designation")
    zoom: float = Field(default=1.0, description="Image zoom level (1.0 - 5.0)")
    x_offset: float = Field(default=0.0, description="Avatar X translation offset in pixels")
    y_offset: float = Field(default=0.0, description="Avatar Y translation offset in pixels")
    resolution: str = Field(default="1080p", description="Output target resolution (1080p or 4k)")


class GenerateBuilderCardRequest(BaseModel):
    image_id: str = Field(..., description="ID of the uploaded avatar image")
    name: str = Field(..., min_length=2, max_length=50, description="Full name of the builder")
    role: str = Field(default="Builder", description="Role designation at Hacker House")
    title: Optional[str] = Field(default="Builder & Hacker", max_length=50, description="Professional title")
    tech_stack: Optional[str] = Field(default="TypeScript, React, Python", max_length=100, description="Comma-separated tech skills")
    github: Optional[str] = Field(None, max_length=39, description="GitHub handle without @")
    twitter: Optional[str] = Field(None, max_length=15, description="Twitter/X handle without @")
    company: Optional[str] = Field(None, max_length=50, description="Deprecated fallback for company/project")
    accent_color: str = Field(default="neon-green", description="Accent color theme")
    resolution: str = Field(default="1080p", description="Output target resolution (1080p or 4k)")


class GenerationResponse(BaseModel):
    id: str = Field(..., description="Unique identifier of the generated asset")
    url: str = Field(..., description="Accessible download URL of the generated asset")
    image_base64: str = Field(..., description="Base64 data URL encoded PNG representation")


class ShareRequest(BaseModel):
    image_id: str = Field(..., description="ID of the generated frame or card to share")


class ShareResponse(BaseModel):
    share_id: str = Field(..., description="Unique share registration ID")
    share_url: str = Field(..., description="Shareable URL of the generated asset")
