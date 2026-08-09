import React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import type { GeneratorFormValues, BuilderRole, AccentColor } from "../../../types"

interface GeneratorFormProps {
  values: GeneratorFormValues
  onChange: (field: keyof GeneratorFormValues, value: any) => void
  activeTab: "frame" | "id_card"
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ values, onChange, activeTab }) => {
  const roleOptions = [
    { value: "Builder", label: "Builder" },
    { value: "Hacker", label: "Hacker" },
    { value: "Speaker", label: "Speaker" },
    { value: "Mentor", label: "Mentor" },
    { value: "Organizer", label: "Organizer" },
  ]

  const accentOptions: { value: AccentColor; label: string; color: string; borderGlow: string }[] = [
    { value: "neon-green", label: "Neon Green", color: "bg-[#39FF14]", borderGlow: "focus:ring-[#39FF14]/30 active:border-[#39FF14]/40" },
    { value: "cyber-cyan", label: "Cyber Cyan", color: "bg-[#00F0FF]", borderGlow: "focus:ring-[#00F0FF]/30 active:border-[#00F0FF]/40" },
    { value: "laser-purple", label: "Laser Purple", color: "bg-[#BD00FF]", borderGlow: "focus:ring-[#BD00FF]/30 active:border-[#BD00FF]/40" },
    { value: "sunset-orange", label: "Sunset Orange", color: "bg-[#FF5C00]", borderGlow: "focus:ring-[#FF5C00]/30 active:border-[#FF5C00]/40" },
  ]

  const frameStyleOptions = [
    { value: "cyber", label: "Cyber Tech", description: "Futuristic tech borders & overlays" },
    { value: "circuit", label: "Circuit Grid", description: "Minimal circular node tracks" },
    { value: "minimal", label: "Studio Minimal", description: "Bold frame with bottom typography" },
  ]

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
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading">
            GitHub Username
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm text-zinc-500 font-mono">@</span>
            <input
              type="text"
              placeholder="github_username"
              value={values.github}
              onChange={(e) => onChange("github", e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-white/8 bg-zinc-950/40 text-white font-sans text-sm placeholder:text-zinc-500 focus:outline-none focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30 transition-all duration-200"
            />
          </div>
        </div>

        <div className="w-full space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading">
            Twitter / X Handle
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm text-zinc-500 font-mono">@</span>
            <input
              type="text"
              placeholder="twitter_username"
              value={values.twitter}
              onChange={(e) => onChange("twitter", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-white/8 bg-zinc-950/40 text-white font-sans text-sm placeholder:text-zinc-500 focus:outline-none focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* 4. Color theme badge selector */}
      <div className="space-y-2 text-left">
        <label id="theme-color-label" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading">
          Pass Theme Color
        </label>
        <div 
          role="radiogroup" 
          aria-labelledby="theme-color-label"
          className="flex flex-wrap gap-3"
        >
          {accentOptions.map((opt) => {
            const isSelected = values.accentColor === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange("accentColor", opt.value)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-250 cursor-pointer focus:outline-none focus:ring-2 ${opt.borderGlow} ${
                  isSelected
                    ? "border-white/20 bg-zinc-900/60 text-white shadow-[0_2px_10px_rgba(255,255,255,0.02)]"
                    : "border-white/5 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
                }`}
              >
                <span className={`h-3 w-3 rounded-full ${opt.color} block shrink-0`} />
                <span className="text-xs font-bold font-heading uppercase tracking-wide">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Custom Graphics template selectors for Frames */}
      {activeTab === "frame" && (
        <div className="space-y-2 text-left animate-fadeIn">
          <label id="graphics-template-label" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading">
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
                  className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 ${
                    isSelected
                      ? "border-white/20 bg-zinc-900/50 text-white"
                      : "border-white/5 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-950/40 hover:border-white/15"
                  }`}
                >
                  <div className="text-xs font-bold font-heading">{opt.label}</div>
                  <div className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-snug">
                    {opt.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
