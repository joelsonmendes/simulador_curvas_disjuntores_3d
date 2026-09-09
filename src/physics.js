import { CURVES } from "./data.js";

export function magneticStatus(curve, multiple){
  const c = CURVES[curve];
  if (multiple < c.magMin) return "below";
  if (multiple <= c.magMax) return "band";
  return "above";
}

export function estimateTrip(curve, multiple){
  const c = CURVES[curve];
  if (multiple <= 1.05) return { mechanism:"normal", seconds:Infinity, certainty:1 };

  if (multiple >= c.magMax) {
    return { mechanism:"magnetic", seconds:0.015, certainty:1 };
  }

  if (multiple >= c.magMin) {
    const p = (multiple - c.magMin) / (c.magMax - c.magMin);
    const seconds = 0.012 + (1-p) * 0.085;
    return { mechanism:"magnetic-band", seconds, certainty:.65 };
  }

  // Modelo didático de tempo inverso, calibrado para visualização.
  const thermalSeconds = Math.max(.12, Math.min(7200, 120 / Math.pow(Math.max(multiple - 1, .05), 2.25)));
  return { mechanism:"thermal", seconds:thermalSeconds, certainty:.8 };
}

export function scenarioMultiple(scenario, load){
  if (scenario === "normal") return load.normalMultiple;
  if (scenario === "overload") return 1.65;
  if (scenario === "motorStart") return load.startMultiple;
  if (scenario === "short") return 22;
  return 1;
}

export function mechanismLabel(mechanism){
  return ({
    normal:"Monitorando",
    thermal:"Proteção térmica",
    "magnetic-band":"Faixa magnética",
    magnetic:"Proteção magnética"
  })[mechanism] || "Monitorando";
}

export function formatTime(seconds){
  if (!isFinite(seconds)) return "Sem disparo previsto";
  if (seconds < .1) return `${Math.round(seconds*1000)} ms`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)} s`;
  if (seconds < 3600) return `${(seconds/60).toFixed(1)} min`;
  return `${(seconds/3600).toFixed(1)} h`;
}
