import { years, currentYear } from "../data/models";

// The three things the site measures, per request.
export const METRICS = {
  water: { key: "water", label: "Water", long: "Millilitres per request (mL)", unit: "mL", icon: "droplet", color: "--water", axis: "mL per request", scale: 1, title: "Water usage" },
  energy: { key: "energy", label: "Energy", long: "Watt-hours per request (Wh)", unit: "Wh", icon: "zap", color: "--energy", axis: "Wh per request", scale: 1, title: "Energy usage" },
  co2: { key: "co2", label: "CO₂", long: "Grams per request (g)", unit: "g", icon: "cloud", color: "--co2", axis: "g per request", scale: 1, title: "CO₂ emissions" },
};

// Number formatting. Keeps 3 significant figures so small values like 0.0042 don't show as 0
export const fmtInt = (n) => n.toLocaleString("en-GB", { maximumSignificantDigits: 3 });
export const fmt1 = fmtInt;

// Value plus unit, e.g. { value: "4.2", unit: "Wh" }
export function compact(metric, v) {
  return { value: fmtInt(v), unit: METRICS[metric].unit };
}

// Finding models
export const byId = (models, id) => models.find((m) => m.id === id);

export const average = (models,metric) =>
  models.length ? models.reduce((sum, m) => sum + m[metric], 0) / models.length : 0;

// Sorting (used by the tables)
export function sortModels(list, key, dir) {
  const mul = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "string") return av.localeCompare(bv) * mul;
    return (av - bv) * mul;
  });
}

// Illustrative past and projected figures for the chart.
// mode: "year" or "cumulative"; range: "all", "last5" or "proj".
export function series(model, metric, { mode = "year", range = "all" } = {}) {
  let values = years.map((y) =>
    y <= currentYear
      ? model[metric] / Math.pow(model.growth, currentYear - y)
      : model[metric] * Math.pow(model.proj, y - currentYear)
  );

  if (mode === "cumulative") {
    let sum = 0;
    values = values.map((v) => (sum += v));
  }

  const keep = (y) =>
    range === "last5" ? y > currentYear - 5 && y <= currentYear
    : range === "proj" ? y >= currentYear
    : true;

  return {
    years: years.filter(keep),
    values: values.filter((_, i) => keep(years[i])),
  };
}