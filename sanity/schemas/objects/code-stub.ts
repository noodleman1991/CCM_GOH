import { defineType } from "sanity"

// Minimal stub to prevent "Component not defined: Code" error
// This component will not be used anywhere but prevents the crash
export default defineType({
  name: "code",
  type: "object",
  title: "Code (Unused)",
  hidden: true, // Hide from studio UI
  fields: [
    {
      name: "placeholder",
      type: "string",
      title: "Placeholder",
      hidden: true
    }
  ]
})