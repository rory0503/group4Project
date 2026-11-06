import { METRICS, fmtInt } from "../../lib/helpers";

const MAX_MODELS = 3;

// Formats a number with its unit, e.g. 41,8000,000 L
const withUnit = (key) => (m) => `${fmtInt(m[key])} ${METRICS[key].unit}`;

// best: "min" = lowest value wins, "max" = highest wins, undefined = nothing to highlight
const ROWS = [
  { label: "Water", key: "water", best: "min", format: withUnit("water") },
  { label: "Energy", key: "energy", best: "min", format: withUnit("energy") },
  { label: "CO₂", key: "co2", best: "min", format: withUnit("co2") },
  { label: "Score", key: "score", best: "max", format: (m) => `${m.score}/30` },
  { label: "Rank", key: "rank", best: "min", format: (m, total) => `#${m.rank} of ${total}` },
  { label: "Projected growth", key: "proj", best: "min", format: (m) => `+${Math.round((m.proj - 1) * 100)}% / yr` },
  { label: "Release year", key: "release", format: (m) => m.release },
  { label: "Company", key: "company", format: (m) => m.company },
];

// Side by side table comparing the chosen models
export default function CompareTable({ models, total }) {
    //Adds a greyed out column when less than 3 models are chosen
  const hasEmptyColumn = models.length < MAX_MODELS;

  return (
    <div className="table-wrap">
      <table className="data-table compare-table">
        <caption className="sr-only">Metric-by-metric comparison of the selected models</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            {/*one column per model, with its slot colour dot*/}
            {models.map((m, i) => (
              <th scope="col" key={m.id}>
                <span className="th-model">
                  <span className="slot-dot" style={{ "--c": `var(--slot-${i + 1})` }} />
                  {m.name}
                </span>
              </th>
            ))}
            {hasEmptyColumn && <th scope="col" className="muted-col">No model selected</th>}
          </tr>
        </thead>
        <tbody>
            {/*One table row per entry is ROWS */}
          {ROWS.map((row) => {
            // Each models value for this row, and which value is the best
            const values = models.map((m) => m[row.key]);
            const target = row.best === "min" ? Math.min(...values) : row.best === "max" ? Math.max(...values) : null;
            // only highlight when exactly one model has the best value
            const hasWinner = models.length > 1 && row.best && values.filter((v) => v === target).length === 1;

            return (
              <tr className="row" key={row.key}>
                <th scope="row">{row.label}</th>
                {/*One cell per model; the iwnner gets a green "Best" highlight*/}
                {models.map((m) => {
                  const isBest = hasWinner && m[row.key] === target;
                  return (
                    <td className={`num${isBest ? " best" : ""}`} key={m.id}>
                      {row.format(m, total)}
                      {isBest && <span className="best-tag">Best</span>}
                    </td>
                  );
                })}
                {hasEmptyColumn && <td className="muted-col">—</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}