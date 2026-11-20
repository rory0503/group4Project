import { METRICS } from "../../lib/helpers";
import { T } from "../../context/TranslationContext";

export default function InsightCards({ models }) {
  if (models.length < 2) return null;

  return (
    <div className="insights">
      {Object.values(METRICS).map((meta) => {
        const sorted = [...models].sort(
          (a, b) => a[meta.key] - b[meta.key]
        );

        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        const pct = Math.round(
          (1 - best[meta.key] / worst[meta.key]) * 100
        );

        const what = meta.key === "co2" ? "CO₂" : meta.label.toLowerCase();
        const Icon = meta.icon;

        return (
          <div
            className="insight"
            key={meta.key}
            style={{ "--c": `var(${meta.color})` }}
          >
            {Icon && typeof Icon !== "string" && (
              <span className="stat-icon">
                <Icon className="icon icon-sm" />
              </span>
            )}

            {pct === 0 ? (
              <p>
                <T>All of these models use about the same</T>{" "}
                <strong>{what}</strong>.
              </p>
            ) : (
              <p>
                <strong>{best.name}</strong>{" "}
                <T>uses</T>{" "}
                <strong>
                  {pct}% <T>less</T> {what}
                </strong>{" "}
                <T>than</T>{" "}
                {worst.name}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}