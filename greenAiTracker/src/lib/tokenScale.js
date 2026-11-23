export const STORED_BASE_TOKENS = 300;

export const TOKEN_SCALES = [
  {
    id: "1",
    label: "Per Token",
    shortLabel: "1 token",
    unitSuffix: "/ token",
    multiplier: 1,
  },
  {
    id: "1k",
    label: "Per 1,000 Tokens",
    shortLabel: "1k tokens",
    unitSuffix: "/ 1k tokens",
    multiplier: 1000,
  },
  {
    id: "10k",
    label: "Per 10,000 Tokens",
    shortLabel: "10k tokens",
    unitSuffix: "/ 10k tokens",
    multiplier: 10000,
  },
  {
    id: "1m",
    label: "Per 1M Tokens",
    shortLabel: "1M tokens",
    unitSuffix: "/ 1M tokens",
    multiplier: 1000000,
  },
];

export const DEFAULT_TOKEN_SCALE_ID = "1k";

export function getTokenScale(scaleId) {
  return (
    TOKEN_SCALES.find((scale) => scale.id === scaleId) ||
    TOKEN_SCALES.find((scale) => scale.id === DEFAULT_TOKEN_SCALE_ID)
  );
}

export function scaleMetricValue(
  rawValue,
  targetMultiplier,
  baseTokens = STORED_BASE_TOKENS
) {
  const value = Number(rawValue);
  const multiplier = Number(targetMultiplier);
  const baseline = Number(baseTokens);

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === "" ||
    !Number.isFinite(value) ||
    !Number.isFinite(multiplier) ||
    !Number.isFinite(baseline) ||
    baseline <= 0
  ) {
    return null;
  }

  return (value / baseline) * multiplier;
}

export function formatScaledMetric(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  value = Number(value);

  if (value === 0) return "0";

  const abs = Math.abs(value);

  if (abs < 0.0001) {
    return value.toExponential(2);
  }

  if (abs < 0.01) {
    return value.toFixed(6);
  }

  if (abs < 1) {
    return value.toFixed(4);
  }

  if (abs < 100) {
    return value.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });
}