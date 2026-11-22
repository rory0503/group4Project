import { Droplet, Zap, Cloud } from "lucide-react";
import { average } from "../../lib/helpers";

import {
  DEFAULT_TOKEN_SCALE_ID,
  formatScaledMetric,
  getTokenScale,
  scaleMetricValue,
} from "../../lib/tokenScale";

const ICONS = {
  droplet: Droplet,
  zap: Zap,
  cloud: Cloud,
};

export default function StatCard({
  meta,
  model,
  average: averageValue,
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID,
}) {
  const Icon = ICONS[meta.icon];
  const activeScale = getTokenScale(tokenScaleId);

  const scaledValue = scaleMetricValue(
    model[meta.key],
    activeScale.multiplier
  );

  const pct = averageValue
    ? Math.round(
        ((model[meta.key] - averageValue) / averageValue) * 100
      )
    : 0;

  const good = pct <= 0;

  return (
    <article className="card stat" style={{ "--c": `var(${meta.color})` }}>
      <div className="stat-top">
        <span className="stat-label">
          <span className="stat-icon">
            <Icon className="icon" />
          </span>
          {meta.title}
        </span>
      </div>

      <p className="stat-value num">
        {formatScaledMetric(scaledValue)}
        <small>{meta.unit}</small>
      </p>

      <div className="stat-top">
        <p className="stat-scope">
          Per {activeScale.shortLabel} · <strong>{model.name}</strong>
        </p>

        <span className={`badge ${good ? "badge-good" : "badge-warn"}`}>
          {pct === 0
            ? "Average"
            : `${Math.abs(pct)}% ${good ? "below" : "above"} avg`}
        </span>
      </div>
    </article>
  );
}