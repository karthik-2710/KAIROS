export function getHealthStatus(ndvi: number | undefined) {
  if (ndvi === undefined) return { text: "Unknown", color: "text-slate-500", border: "border-slate-500/40", bg: "#94a3b8" }
  if (ndvi >= 0.75) return { text: "Excellent", color: "text-green-500", border: "border-green-500/40", bg: "#1B5E20" }
  if (ndvi >= 0.60) return { text: "Healthy", color: "text-green-400", border: "border-green-400/40", bg: "#2E7D32" }
  if (ndvi >= 0.45) return { text: "Moderate", color: "text-[#FBC02D]", border: "border-[#FBC02D]/40", bg: "#FBC02D" }
  if (ndvi >= 0.30) return { text: "Stress", color: "text-[#F57C00]", border: "border-[#F57C00]/40", bg: "#F57C00" }
  return { text: "Severe", color: "text-red-500", border: "border-red-500/40", bg: "#d32f2f" }
}
