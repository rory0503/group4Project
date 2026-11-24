import { useMemo } from "react";
import { METRICS } from "../../lib/helpers";
import {
  DEFAULT_TOKEN_SCALE_ID,
  formatScaledMetric,
  getTokenScale,
  scaleMetricValue,
} from "../../lib/tokenScale";

// "Model A uses 22% less water than Model B (saves 1.42 L / 1k tokens)" — one line per metric.
export default function InsightCards({
  models,
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID,
}) {
  const activeScale = useMemo(() => getTokenScale(tokenScaleId), [tokenScaleId]);

  // needs at least 2 models to compare
  if (models.length < 2) return null;

  return (
    <div className="insights">
      {/* One insight per metric */}
      {Object.values(METRICS).map((meta) => {
        // sort lowest to highest: first is the best model, last is the worst
        const sorted = [...models].sort((a, b) => a[meta.key] - b[meta.key]);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        const bestScaled = scaleMetricValue(best[meta.key], activeScale.multiplier);
        const worstScaled = scaleMetricValue(worst[meta.key], activeScale.multiplier);
        const savedScaled =
          bestScaled != null && worstScaled != null ? worstScaled - bestScaled : 0;

        // How much less the best model uses compared to the worst as a percentage.
        const pct =
          worstScaled > 0 ? Math.round((1 - bestScaled / worstScaled) * 100) : 0;

        // The word used in the sentence
        const what = meta.key === "co2" ? "CO₂" : meta.label.toLowerCase();
        const Icon = meta.icon;

        return (
          // --c sets the colour for this metric
          <div className="insight" key={meta.key} style={{ "--c": `var(${meta.color})` }}>
            {/* Metric icon */}
            {Icon && typeof Icon !== "string" && (
              <span className="stat-icon">
                <Icon className="icon icon-sm" />
              </span>
            )}
            {/* if there is no difference, say so. Otherwise show the % and scaled unit savings */}
            {pct === 0 ? (
              <p>
                All of these models use about the same <strong>{what}</strong> ({activeScale.shortLabel}).
              </p>
            ) : (
              <p>
                <strong>{best.name}</strong> uses <strong>{pct}% less {what}</strong> than{" "}
                {worst.name} (saves {formatScaledMetric(savedScaled)} {meta.unit}{" "}
                {activeScale.unitSuffix}).
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}