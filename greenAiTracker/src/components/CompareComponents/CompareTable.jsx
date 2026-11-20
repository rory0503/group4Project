import { METRICS, fmtInt } from "../../lib/helpers";
import { T } from "../../context/TranslationContext";

const MAX_MODELS = 3;

const withUnit = (key) => (m) =>
  `${fmtInt(m[key])} ${METRICS[key].unit}`;

const ROWS = [
  { label: "Water", key: "water", best: "min", format: withUnit("water") },
  { label: "Energy", key: "energy", best: "min", format: withUnit("energy") },
  { label: "CO₂", key: "co2", best: "min", format: withUnit("co2") },
  { label: "Score", key: "score", best: "max", format: (m) => `${m.score}/30` },
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
  { label: "Release year", key: "release", format: (m) => m.release },
  { label: "Company", key: "company", format: (m) => m.company },
];

export default function CompareTable({ models, total }) {
  const hasEmptyColumn = models.length < MAX_MODELS;

  return (
    <div className="table-wrap">
      <table className="data-table compare-table">
        <caption className="sr-only">
          <T>Metric-by-metric comparison of the selected models</T>
        </caption>

        <thead>
          <tr>
            <th scope="col"><T>Metric</T></th>

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
                <T>No model selected</T>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {ROWS.map((row) => {
            const values = models.map((m) => m[row.key]);

            const target =
              row.best === "min"
                ? Math.min(...values)
                : row.best === "max"
                  ? Math.max(...values)
                  : null;

            const hasWinner =
              models.length > 1 &&
              row.best &&
              values.filter((v) => v === target).length === 1;

            return (
              <tr className="row" key={row.key}>
                <th scope="row">
                  <T>{row.label}</T>
                </th>

                {models.map((m) => {
                  const isBest = hasWinner && m[row.key] === target;

                  return (
                    <td
                      className={`num${isBest ? " best" : ""}`}
                      key={m.id}
                    >
                      {row.format(m, total)}
                      {isBest && (
                        <span className="best-tag">
                          <T>Best</T>
                        </span>
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