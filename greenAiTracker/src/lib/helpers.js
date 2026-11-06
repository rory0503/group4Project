import { years, currentYear } from "../data/models";

// The three things the site measures.
export const METRICS = {
  water: { key: "water", label: "Water", long: "Litres (L)", unit: "L", icon: "droplet", color: "--water", axis: "million L", scale: 1e6, title: "Water usage" },
  energy: { key: "energy", label: "Energy", long: "Gigawatt-hours (GWh)", unit: "GWh", icon: "zap", color: "--energy", axis: "GWh", scale: 1, title: "Energy usage" },
  co2: { key: "co2", label: "CO₂", long: "Metric tonnes (t)", unit: "t", icon: "cloud", color: "--co2", axis: "thousand t", scale: 1e3, title: "CO₂ emissions" },
};

// Number formatting
export const fmtInt = (n) => Math.round(n).toLocaleString("en-GB");
export const fmt1 = (n) =>
  (Math.round(n * 10) / 10).toLocaleString("en-GB", { maximumFractionDigits: 1 });

// Short value plus unit, e.g. { value: "68.4", unit: "M L" }
export function compact(metric, v) {
  if (metric === "water") return { value: fmt1(v / 1e6), unit: "M L" };
  if (metric === "co2") return { value: fmt1(v / 1e3), unit: "k t" };
  return { value: fmtInt(v), unit: "GWh" };
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