import React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import type { GeneratorFormValues, BuilderRole } from "../../../types"
import { useTheme } from "@/context/ThemeContext"

interface GeneratorFormProps {
  values: GeneratorFormValues
  onChange: (field: keyof GeneratorFormValues, value: any) => void
  activeTab: "frame" | "id_card"
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ values, onChange }) => {
  const { theme, activeGradient } = useTheme()
  const isGoaNight = activeGradient === "goa-night"

  const roleOptions = [
    { value: "Builder", label: "Builder" },
    { value: "Hacker", label: "Hacker" },
    { value: "Speaker", label: "Speaker" },
    { value: "Mentor", label: "Mentor" },
    { value: "Organizer", label: "Organizer" },
  ]

  const frameStyleOptions = [
    { value: "cyber", label: "Frame 1", description: "Existing cyberpunk tech border design" },
    { value: "goa-classic", label: "Frame 2 — Goa Heritage", description: "Realistic cream/green credential design" },
    { value: "goa-builder", label: "Frame 3 — HH Goa Builder", description: "Realistic cream physical ID credential with tropical scenery" },
  ]

  const labelStyle = isGoaNight
    ? "text-zinc-200 font-bold"
    : theme === "light"
    ? "text-[#052017]"
    : "text-zinc-400"

  const inputStyle = isGoaNight
    ? "bg-[#052017]/90 border-[#1E6F43]/40 text-white placeholder:text-zinc-500 focus:border-[#00FF87] focus:ring-1 focus:ring-[#00FF87]/30"
    : theme === "light"
    ? "bg-white/95 border-[#0B4B2E]/20 text-[#052017] placeholder:text-[#052017]/40 focus:border-[#1E6F43] focus:ring-1 focus:ring-[#1E6F43]/30"
    : "bg-zinc-950/40 border-white/8 text-white placeholder:text-zinc-500 focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30"

  return (
    <div className="space-y-6">
      {/* 1. Name and Role Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. Saran Kumar"
          value={values.name}
          maxLength={30}
          onChange={(e) => onChange("name", e.target.value)}
          aria-required="true"
        />
        
        <Select
          label="Hacker House Role"
          options={roleOptions}
          value={values.role}
          onChange={(e) => onChange("role", e.target.value as BuilderRole)}
        />
      </div>

      {/* 2. Designation and Skills Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Builder Title / Designation"
          placeholder="e.g. AI Systems Architect"
          value={values.title}
          maxLength={35}
          onChange={(e) => onChange("title", e.target.value)}
        />

        <Input
          label="Primary Tech Stack"
          placeholder="e.g. React, Rust, PyTorch"
          value={values.techStack}
          maxLength={60}
          onChange={(e) => onChange("techStack", e.target.value)}
        />
      </div>

      {/* 3. GitHub and Twitter username inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full space-y-1.5 text-left">
          <label className={`block text-xs uppercase tracking-wider font-heading ${labelStyle}`}>
            GitHub Username
          </label>
          <div className="relative flex items-center">
            <span className={`absolute left-4 text-sm font-mono ${
              isGoaNight ? "text-[#00FF87]" : theme === "light" ? "text-[#1E6F43]" : "text-zinc-500"
            }`}>@</span>
            <input
              type="text"
              placeholder="github_username"
              value={values.github}
              onChange={(e) => onChange("github", e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
              className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all duration-200 ${inputStyle}`}
            />
          </div>
        </div>

        <div className="w-full space-y-1.5 text-left">
          <label className={`block text-xs uppercase tracking-wider font-heading ${labelStyle}`}>
            Twitter / X Handle
          </label>
          <div className="relative flex items-center">
            <span className={`absolute left-4 text-sm font-mono ${
              isGoaNight ? "text-[#00FF87]" : theme === "light" ? "text-[#1E6F43]" : "text-zinc-500"
            }`}>@</span>
            <input
              type="text"
              placeholder="twitter_username"
              value={values.twitter}
              onChange={(e) => onChange("twitter", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all duration-200 ${inputStyle}`}
            />
          </div>
        </div>
      </div>

      {/* 5. Custom Graphics template selectors */}
      <div className="space-y-2 text-left animate-fadeIn">
        <label id="graphics-template-label" className={`block text-xs uppercase tracking-wider font-heading ${labelStyle}`}>
          Frame Graphics Template
        </label>
        <div 
          role="radiogroup" 
          aria-labelledby="graphics-template-label"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {frameStyleOptions.map((opt) => {
            const isSelected = values.frameStyle === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange("frameStyle", opt.value)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${
                  isGoaNight
                    ? isSelected
                      ? "border-[#00FF87] bg-[#0B4B2E] text-white shadow-[0_0_15px_rgba(0,255,135,0.25)] font-bold"
                      : "border-[#1E6F43]/40 bg-[#052017]/80 text-zinc-200 hover:bg-[#0B4B2E]/60 hover:text-white"
                    : theme === "light"
                    ? isSelected
                      ? "border-[#1E6F43] bg-[#1E6F43]/10 text-[#052017] shadow-sm font-bold"
                      : "border-[#0B4B2E]/15 bg-white/70 text-[#052017]/70 hover:bg-white hover:border-[#1E6F43]/30"
                    : isSelected
                      ? "border-white/20 bg-zinc-900/50 text-white"
                      : "border-white/5 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-950/40 hover:border-white/15"
                }`}
              >
                <div className="text-xs font-bold font-heading">{opt.label}</div>
                <div className={`text-[10px] font-sans mt-0.5 leading-snug ${
                  isGoaNight
                    ? isSelected ? "text-[#00FF87]" : "text-zinc-300"
                    : theme === "light"
                    ? "text-[#1E6F43]/80"
                    : "text-zinc-400"
                }`}>
                  {opt.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
