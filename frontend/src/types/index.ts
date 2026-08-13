export type GeneratorTab = "frame" | "id_card"

export type BuilderRole = "Builder" | "Hacker" | "Speaker" | "Mentor" | "Organizer"

export type AccentColor = "neon-green" | "cyber-cyan" | "laser-purple" | "sunset-orange"

export interface GeneratorFormValues {
  name: string
  role: BuilderRole
  title: string
  techStack: string
  github: string
  twitter: string
  accentColor: AccentColor
  frameStyle: "cyber" | "goa-classic" | "goa-builder" | "minimal" | "circuit"
}
