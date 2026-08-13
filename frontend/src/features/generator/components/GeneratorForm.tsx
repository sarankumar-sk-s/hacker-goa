import React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import type { GeneratorFormValues, BuilderRole } from "../../../types"

interface GeneratorFormProps {
  values: GeneratorFormValues
  onChange: (field: keyof GeneratorFormValues, value: any) => void
  activeTab: "frame" | "id_card"
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ values, onChange }) => {
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



      {/* 5. Custom Graphics template selectors */}
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
    </div>
  )
}
