import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { METRICS } from "../lib/helpers";
import { buildSeries, CURRENT_YEAR } from "../lib/series";
 
// The unit each metric is measured in (the same units the backend values are converted to)
const UNITS = { water: "L", energy: "Wh", co2: "g" };
 
// The line colour follows the chosen metric: water is blue, energy is green and CO2 is purple
const METRIC_VARS = { water: "--water", energy: "--energy", co2: "--co2" };
 
// When two or three models are shown, each gets its own marker shape as well as its own shade
const POINT_STYLES = ["circle", "triangle", "rect"];
 
// Reads a CSS variable (for example --border) so the chart follows light and dark mode
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
 
// Turns any CSS colour into [red, green, blue] (the browser does the converting)
function toRgb(colour) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
 
// Moves a colour towards white (target 255) or black (target 0) by a fraction, e.g. 0.4 = 40% of the way
const shade = ([r, g, b], target, amount) =>
  `rgb(${Math.round(r + (target - r) * amount)}, ${Math.round(g + (target - g) * amount)}, ${Math.round(b + (target - b) * amount)})`;
 
// The three line colours for a metric: the metric's own colour first, then two shades of it
function lineColours(metric) {
  const base = toRgb(cssVar(METRIC_VARS[metric]));
  const dark = document.documentElement.dataset.theme === "dark";
  return dark
    ? [shade(base, 255, 0), shade(base, 255, 0.45), shade(base, 255, 0.75)] // lighter shades show up better on dark
    : [shade(base, 255, 0), shade(base, 255, 0.4), shade(base, 0, 0.4)];
}
 
// Full number for tooltips, e.g. 1,234.5
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString("en-GB", { maximumFractionDigits: 1 });
// Short number for the axis, e.g. 1.2K or 3.4M, so large values stay readable
const fmtShort = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format;
 
// Draws the shaded "Projection" area behind the lines for years after the current one
const projectionPlugin = {
  id: "projection",
  beforeDatasetsDraw(chart, _args, options) {
    const index = options.startIndex;
    if (index == null || index < 0 || index >= chart.data.labels.length - 1) return;
    const { ctx, chartArea: area, scales } = chart;
    const x = scales.x.getPixelForValue(index);
    ctx.save();
    ctx.fillStyle = cssVar("--proj-fill");
    ctx.fillRect(x, area.top, area.right - x, area.bottom - area.top);
    ctx.strokeStyle = cssVar("--border-strong");
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, area.top);
    ctx.lineTo(x, area.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cssVar("--muted");
    ctx.font = "500 12px Inter, system-ui, sans-serif";
    ctx.fillText("Projection", x + 8, area.top + 16);
    ctx.restore();
  },
};
 
// A small line with the model's marker shape on it, in the model's colour (used in the legend)
function LegendMark({ shape, colour }) {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
      <line x1="0" y1="6" x2="24" y2="6" stroke={colour} strokeWidth="2.5" />
      {shape === "circle" && <circle cx="12" cy="6" r="4" fill="var(--surface)" stroke={colour} strokeWidth="2" />}
      {shape === "triangle" && <path d="M12 1.5 16.5 10 7.5 10Z" fill="var(--surface)" stroke={colour} strokeWidth="2" strokeLinejoin="round" />}
      {shape === "rect" && <rect x="8" y="2" width="8" height="8" fill="var(--surface)" stroke={colour} strokeWidth="2" />}
    </svg>
  );
}
 
// items: [{ model, slot }]  (slot 0, 1 or 2 picks the line shade and marker shape)
// metric: "water" | "energy" | "co2"      mode: "year" | "cumulative"      range: "all" | "last5" | "proj"
export default function TrendChart({ items, metric, mode, range }) {
  const canvasRef = useRef(null);
  const meta = METRICS[metric];
 
  // Goes up by one whenever the site switches between light and dark, so the chart is redrawn in the new colours
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((n) => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
 
  // The line colours for this metric (worked out again when the metric or the theme changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colours = useMemo(() => lineColours(metric), [metric, themeTick]);
 
  // A short text "fingerprint" of the models and their figures. It only changes when the data really changes,
  // so the chart isn't rebuilt every time the page around it re-renders.
  const dataKey = items
    .map(({ model, slot }) => `${slot}:${model.id}:${model[metric]}:${model.growth}:${model.proj}:${model.history?.length ?? 0}`)
    .join("|");
 
  // Yearly values for every line. Recalculated only when the models or settings change.
  const sets = useMemo(
    () => items.map(({ model, slot }) => ({ model, slot, ...buildSeries(model, metric, { mode, range }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataKey, metric, mode, range]
  );
 
  // Build (or rebuild) the chart whenever the data, settings or theme change
  useEffect(() => {
    if (!canvasRef.current || sets.length === 0) return undefined;
 
    const unit = UNITS[metric];
    const years = sets[0].years;
    const startIndex = years.indexOf(CURRENT_YEAR); // where the projected part begins
    const grid = cssVar("--border");
    const muted = cssVar("--muted");
    const surface = cssVar("--surface");
 
    const datasets = sets.map(({ model, slot, values }) => {
      const color = colours[slot];
      return {
        label: model.name,
        data: values,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: surface,
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointStyle: POINT_STYLES[slot],
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        tension: 0.3,
        // Projected years are drawn as a dashed line
        segment: { borderDash: (ctx) => (startIndex >= 0 && ctx.p0DataIndex >= startIndex ? [6, 5] : undefined) },
      };
    });
 
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: years, datasets },
      plugins: [projectionPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 450 },
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 4 } },
        plugins: {
          legend: { display: false }, // the legend is drawn below, in HTML
          projection: { startIndex },
          tooltip: {
            backgroundColor: "#0b2a20",
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: "Inter", weight: "600" },
            bodyFont: { family: "Inter" },
            usePointStyle: true,
            callbacks: {
              title: (context) => `${context[0].label}${+context[0].label > CURRENT_YEAR ? " (projected)" : ""}`,
              label: (context) => ` ${context.dataset.label}: ${fmt1(context.parsed.y)} ${unit}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: grid },
            ticks: { color: muted, font: { family: "Inter", size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: grid },
            border: { display: false },
            ticks: { color: muted, font: { family: "Inter", size: 12 }, maxTicksLimit: 6, callback: (value) => fmtShort(value) },
            title: { display: true, text: `${meta.title} (${UNITS[metric]})`, color: muted, font: { family: "Inter", size: 12 } },
          },
        },
      },
    });
 
    // Remove the old chart before a new one is drawn (and when the page closes)
    return () => chart.destroy();
  }, [sets, metric, meta, colours, themeTick]);
 
  // True when any line is estimated rather than real yearly figures
  const anyEstimated = sets.some((set) => set.estimated);
 
  if (sets.length === 0) return null;
 
  return (
    <>
      {/* Coloured key: one entry per model, then what solid and dashed lines mean */}
      <div className="legend">
        {sets.map(({ model, slot }) => (
          <span className="legend-item" key={model.id}>
            <LegendMark shape={POINT_STYLES[slot]} colour={colours[slot]} />
            {model.name}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-line" />
          Actual
        </span>
        <span className="legend-item">
          <span className="legend-line dashed" />
          Projected (illustrative)
        </span>
      </div>
 
      <div className="chart-box">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Line chart of ${meta.title.toLowerCase()} per year for ${sets.map((s) => s.model.name).join(", ")}`}
        />
      </div>
 
      {/* Honest note while the yearly figures are still estimates */}
      {anyEstimated && (
        <p className="card-sub">
          Illustrative trend: yearly figures are estimated from each model's current value until real yearly data is
          available.
        </p>
      )}
 
      {/* The same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>
          {meta.title} ({UNITS[metric]})
        </caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            {sets.map(({ model }) => (
              <th scope="col" key={model.id}>{model.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sets[0].years.map((year, i) => (
            <tr key={year}>
              <th scope="row">{year}{year > CURRENT_YEAR ? " (projected)" : ""}</th>
              {sets.map(({ model, values }) => (
                <td key={model.id}>{values[i] == null ? "no data" : fmt1(values[i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
 
