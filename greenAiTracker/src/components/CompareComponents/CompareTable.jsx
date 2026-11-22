import { METRICS } from "../../lib/helpers";

import {
  DEFAULT_TOKEN_SCALE_ID,
  formatScaledMetric,
  getTokenScale,
  scaleMetricValue,
} from "../../lib/tokenScale";

const MAX_MODELS = 3;

const ROWS = [
  { label: "Water", key: "water", best: "min", scalable: true },
  { label: "Energy", key: "energy", best: "min", scalable: true },
  { label: "CO₂", key: "co2", best: "min", scalable: true },

  {
    label: "Score",
    key: "score",
    best: "max",
    format: (m) => `${m.score}/12`,
  },
  {
    label: "Rank",
    key: "rank",
    best: "min",
    format: (m, total) => `#${m.rank} of ${total}`,
  },
  {
    label: "Projected growth",
    key: "proj",
    best: "min",
    format: (m) => `+${Math.round((m.proj - 1) * 100)}% / yr`,
  },
  {
    label: "Release year",
    key: "release",
    format: (m) => m.release ?? "—",
  },
  {
    label: "Company",
    key: "company",
    format: (m) => m.company,
  },
];

export default function CompareTable({
  models,
  total,
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID,
}) {
  const activeScale = getTokenScale(tokenScaleId);
  const hasEmptyColumn = models.length < MAX_MODELS;

  return (
    <div className="table-wrap">
      <table className="data-table compare-table">
        <caption className="sr-only">
          Model comparison. Environmental measurements are shown per{" "}
          {activeScale.shortLabel}.
        </caption>

        <thead>
          <tr>
            <th scope="col">Metric</th>

            {models.map((m, i) => (
              <th scope="col" key={m.id}>
                <span className="th-model">
                  <span
                    className="slot-dot"
                    style={{ "--c": `var(--slot-${i + 1})` }}
                  />
                  {m.name}
                </span>
              </th>
            ))}

            {hasEmptyColumn && (
              <th scope="col" className="muted-col">
                No model selected
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {ROWS.map((row) => {
            const values = models.map((m) =>
              row.scalable
                ? scaleMetricValue(m[row.key], activeScale.multiplier)
                : m[row.key]
            );

            const validValues = values.filter(
              (value) => value !== null && Number.isFinite(value)
            );

            let target = null;

            if (row.best === "min" && validValues.length > 0) {
              target = Math.min(...validValues);
            }

            if (row.best === "max" && validValues.length > 0) {
              target = Math.max(...validValues);
            }

            const hasWinner =
              models.length > 1 &&
              row.best &&
              validValues.length === models.length &&
              values.filter((value) => value === target).length === 1;

            return (
              <tr className="row" key={row.key}>
                <th scope="row">
                  {row.scalable
                    ? `${row.label} (${activeScale.shortLabel})`
                    : row.label}
                </th>

                {models.map((m, i) => {
                  const isBest =
                    hasWinner && values[i] === target;

                  const displayValue = row.scalable
                    ? `${formatScaledMetric(values[i])} ${
                        METRICS[row.key].unit
                      } ${activeScale.unitSuffix}`
                    : row.format(m, total);

                  return (
                    <td
                      className={`num${isBest ? " best" : ""}`}
                      key={m.id}
                    >
                      {displayValue}

                      {isBest && (
                        <span className="best-tag">Best</span>
                      )}
                    </td>
                  );
                })}

                {hasEmptyColumn && (
                  <td className="muted-col">—</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}