import { Droplet, Zap, Cloud } from "lucide-react";
import { compact } from "../../lib/helpers";
import { T } from "../../context/TranslationContext";

const ICONS = {
  droplet: Droplet,
  zap: Zap,
  cloud: Cloud,
};

export default function StatCard({ meta, model, average }) {
  const Icon = ICONS[meta.icon];
  const v = compact(meta.key, model[meta.key]);

  const pct = average
    ? Math.round(((model[meta.key] - average) / average) * 100)
    : 0;

  const good = pct <= 0;

  return (
    <article
      className="card stat"
      style={{ "--c": `var(${meta.color})` }}
    >
      <div className="stat-top">
        <span className="stat-label">
          <span className="stat-icon">
            <Icon className="icon" />
          </span>
          <T>{meta.title}</T>
        </span>
      </div>

      <p className="stat-value num">
        {v.value}
        <small>{v.unit}</small>
      </p>

      <div className="stat-top">
        <p className="stat-scope">
          <T>Per year</T> · <strong>{model.name}</strong>
        </p>

        <span className={`badge ${good ? "badge-good" : "badge-warn"}`}>
          {pct === 0 ? (
            <T>Average</T>
          ) : (
            <>
              {Math.abs(pct)}%{" "}
              <T>{good ? "below" : "above"}</T>{" "}
              <T>avg</T>
            </>
          )}
        </span>
      </div>
    </article>
  );
}