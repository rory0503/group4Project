import { scaleMetricValue, STORED_BASE_TOKENS } from "./tokenScale";

export const YEARS = [
  2020, 2021, 2022, 2023, 2024, 2025,
  2026, 2027, 2028, 2029, 2030
];

export const CURRENT_YEAR = 2026;

const DEFAULT_GROWTH = 1.25;
const DEFAULT_PROJ = 1.12;

const rate = (value, fallback) =>
  value == null || value === 1 ? fallback : value;

export const hasHistory = (model) =>
  Array.isArray(model.history) && model.history.length > 0;

export function buildSeries(
  model,
  metric,
  {
    mode = "year",
    range = "all",
    scaleMultiplier = STORED_BASE_TOKENS,
    baseTokens = STORED_BASE_TOKENS,
  } = {}
) {
  const estimated = !hasHistory(model);

  let values;

  if (estimated) {
    const growth = rate(model.growth, DEFAULT_GROWTH);
    const proj = rate(model.proj, DEFAULT_PROJ);

    values = YEARS.map((year) =>
      year <= CURRENT_YEAR
        ? model[metric] / Math.pow(growth, CURRENT_YEAR - year)
        : model[metric] * Math.pow(proj, year - CURRENT_YEAR)
    );
  } else {
    values = YEARS.map(
      (year) =>
        model.history.find((row) => row.year === year)?.[metric] ?? null
    );
  }

  // Calculate cumulative values without filling missing data gaps.
  if (mode === "cumulative") {
    let sum = 0;

    values = values.map((value) => {
      if (value === null || value === undefined) {
        return null;
      }

      sum += value;
      return sum;
    });
  }

  const keep = (year) => {
    if (range === "last5") {
      return year > CURRENT_YEAR - 5 && year <= CURRENT_YEAR;
    }

    if (range === "proj") {
      return year >= CURRENT_YEAR;
    }

    return true;
  };

  const filteredYears = YEARS.filter(keep);

  const filteredValues = values
    .filter((_, index) => keep(YEARS[index]))
    .map((value) =>
      value === null
        ? null
        : scaleMetricValue(value, scaleMultiplier, baseTokens)
    );

  return {
    years: filteredYears,
    values: filteredValues,
    estimated,
  };
}