import { METRICS } from "../../lib/helpers";

// "Model A uses 22% less water than Model B" — one line per metric.
export default function InsightCards({ models }) {
    //needs at least 2 models to compare
  if (models.length < 2) return null;

  return (
    <div className="insights">
        {/*One insight per metric*/}
      {Object.values(METRICS).map((meta) => {
        // sort lowest to highest: first is the best model, last is the worst*/}
        const sorted = [...models].sort((a, b) => a[meta.key] - b[meta.key]);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        //How much less the best model uses compared to the worst as a percentage.
        const pct = Math.round((1 - best[meta.key] / worst[meta.key]) * 100);
        
        //The word used in the sentence
        const what = meta.key === "co2" ? "CO₂" : meta.label.toLowerCase();
        const Icon = meta.icon;

        return (
            // --c sets the colour for this metric
          <div className="insight" key={meta.key} style={{ "--c": `var(${meta.color})` }}>
            {/*Metric icon*/}
            {Icon && typeof Icon !== "string" && (
              <span className="stat-icon">
                <Icon className="icon icon-sm" />
              </span>
            )}
            {/*if there is no diference, say so. Otherwise show the % difference*/}
            {pct === 0 ? (
              <p>All of these models use about the same <strong>{what}</strong>.</p>
            ) : (
              <p>
                <strong>{best.name}</strong> uses <strong>{pct}% less {what}</strong> than {worst.name}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}