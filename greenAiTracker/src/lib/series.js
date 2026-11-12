// Yearly figures for the trend chart.
// The years shown, and the "current" year (everything after it is a projection).
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
export const CURRENT_YEAR = 2026;

// The backend only sends one current value per model for now (growth and proj are placeholders of 1),
// so these rates are used to estimate the other years until real yearly figures exist.
const DEFAULT_GROWTH = 1.25; // each past year was this much smaller than the next
const DEFAULT_PROJ = 1.12; // each future year is this much bigger than the last

// A growth of 1 (or nothing) means "not known yet", so the default is used instead
const rate = (value, fallback) => (value == null || value === 1 ? fallback : value);

// True when the model comes with real yearly figures:
// model.history = [{ year: 2024, water: 1, energy: 2, co2: 3 }, ...]
export const hasHistory = (model) => Array.isArray(model.history) && model.history.length > 0;

// Works out one model's yearly values for one metric.
// mode:  "year" (each year on its own) or "cumulative" (running total)
// range: "all" (2020–2030), "last5" (the last 5 years up to now) or "proj" (now onwards)
// Returns { years, values, estimated } where estimated is true when the figures are worked out, not real.
export function buildSeries(model, metric, { mode = "year", range = "all" } = {}) {
  const estimated = !hasHistory(model);
  let values;

  if (estimated) {
    // Estimate: past years shrink by the growth rate, future years grow by the projection rate
    const growth = rate(model.growth, DEFAULT_GROWTH);
    const proj = rate(model.proj, DEFAULT_PROJ);
    values = YEARS.map((year) =>
      year <= CURRENT_YEAR
        ? model[metric] / Math.pow(growth, CURRENT_YEAR - year)
        : model[metric] * Math.pow(proj, year - CURRENT_YEAR)
    );
  } else {
    // Real figures from the backend (a year with no figure is left as a gap)
    values = YEARS.map((year) => model.history.find((row) => row.year === year)?.[metric] ?? null);
  }

  // Running total
  if (mode === "cumulative") {
    let sum = 0;
    values = values.map((value) => (sum += value ?? 0));
  }

  // Keep only the years in the chosen range
  const keep = (year) =>
    range === "last5" ? year > CURRENT_YEAR - 5 && year <= CURRENT_YEAR : range === "proj" ? year >= CURRENT_YEAR : true;

  return {
    years: YEARS.filter(keep),
    values: values.filter((_, i) => keep(YEARS[i])),
    estimated,
  };
}