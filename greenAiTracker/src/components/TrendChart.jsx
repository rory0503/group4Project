import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { METRICS } from "../lib/helpers";
import { buildSeries, CURRENT_YEAR } from "../lib/series";
import { T, useTranslation } from "../context/TranslationContext";

const UNITS = {
  water: "L",
  energy: "Wh",
  co2: "g",
};

const METRIC_VARS = {
  water: "--water",
  energy: "--energy",
  co2: "--co2",
};

const POINT_STYLES = ["circle", "triangle", "rect"];

const cssVar = (name) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

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

const shade = ([r, g, b], target, amount) =>
  `rgb(${Math.round(r + (target - r) * amount)}, ${Math.round(g + (target - g) * amount)}, ${Math.round(b + (target - b) * amount)})`;

function lineColours(metric) {
  const base = toRgb(cssVar(METRIC_VARS[metric]));
  const dark = document.documentElement.dataset.theme === "dark";

  return dark
    ? [
        shade(base, 255, 0),
        shade(base, 255, 0.45),
        shade(base, 255, 0.75),
      ]
    : [
        shade(base, 255, 0),
        shade(base, 255, 0.4),
        shade(base, 0, 0.4),
      ];
}

const fmt1 = (n) =>
  (Math.round(n * 10) / 10).toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });

const fmtShort = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
}).format;

const projectionPlugin = {
  id: "projection",

  beforeDatasetsDraw(chart, _args, options) {
    const index = options.startIndex;

    if (
      index == null ||
      index < 0 ||
      index >= chart.data.labels.length - 1
    ) {
      return;
    }

    const { ctx, chartArea: area, scales } = chart;
    const x = scales.x.getPixelForValue(index);

    ctx.save();

    ctx.fillStyle = cssVar("--proj-fill");
    ctx.fillRect(
      x,
      area.top,
      area.right - x,
      area.bottom - area.top
    );

    ctx.strokeStyle = cssVar("--border-strong");
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, area.top);
    ctx.lineTo(x, area.bottom);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = cssVar("--muted");
    ctx.font = "500 12px Inter, system-ui, sans-serif";
    ctx.fillText(options.label || "Projection", x + 8, area.top + 16);

    ctx.restore();
  },
};

function LegendMark({ shape, colour }) {
  return (
    <svg
      width="24"
      height="12"
      viewBox="0 0 24 12"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="6"
        x2="24"
        y2="6"
        stroke={colour}
        strokeWidth="2.5"
      />

      {shape === "circle" && (
        <circle
          cx="12"
          cy="6"
          r="4"
          fill="var(--surface)"
          stroke={colour}
          strokeWidth="2"
        />
      )}

      {shape === "triangle" && (
        <path
          d="M12 1.5 16.5 10 7.5 10Z"
          fill="var(--surface)"
          stroke={colour}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {shape === "rect" && (
        <rect
          x="8"
          y="2"
          width="8"
          height="8"
          fill="var(--surface)"
          stroke={colour}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

export default function TrendChart({ items, metric, mode, range }) {
  const canvasRef = useRef(null);
  const meta = METRICS[metric];

  const { lang, translateTexts } = useTranslation();

  const [chartText, setChartText] = useState({
    projection: "Projection",
    projected: "projected",
    actual: "Actual",
    projectedIllustrative: "Projected (illustrative)",
    estimatedNote:
      "Illustrative trend: yearly figures are estimated from each model's current value until real yearly data is available.",
    noData: "no data",
    chartDescriptionStart: "Line chart of",
    chartDescriptionMiddle: "per year for",
  });

  // Translate text used directly by Chart.js, which cannot render React components.
  useEffect(() => {
    let cancelled = false;

    const originalTexts = [
      "Projection",
      "projected",
      "Actual",
      "Projected (illustrative)",
      "Illustrative trend: yearly figures are estimated from each model's current value until real yearly data is available.",
      "no data",
      "Line chart of",
      "per year for",
    ];

    translateTexts(originalTexts)
      .then((translated) => {
        if (cancelled || !Array.isArray(translated)) return;

        setChartText({
          projection: translated[0] || originalTexts[0],
          projected: translated[1] || originalTexts[1],
          actual: translated[2] || originalTexts[2],
          projectedIllustrative:
            translated[3] || originalTexts[3],
          estimatedNote: translated[4] || originalTexts[4],
          noData: translated[5] || originalTexts[5],
          chartDescriptionStart:
            translated[6] || originalTexts[6],
          chartDescriptionMiddle:
            translated[7] || originalTexts[7],
        });
      })
      .catch(() => {
        // Keep the original English labels if translation is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [lang, translateTexts]);

  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setThemeTick((n) => n + 1)
    );

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colours = useMemo(
    () => lineColours(metric),
    [metric, themeTick]
  );

  const dataKey = items
    .map(
      ({ model, slot }) =>
        `${slot}:${model.id}:${model[metric]}:${model.growth}:${model.proj}:${model.history?.length ?? 0}`
    )
    .join("|");

  const sets = useMemo(
    () =>
      items.map(({ model, slot }) => ({
        model,
        slot,
        ...buildSeries(model, metric, { mode, range }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataKey, metric, mode, range]
  );

  useEffect(() => {
    if (!canvasRef.current || sets.length === 0) {
      return undefined;
    }

    const unit = UNITS[metric];
    const years = sets[0].years;
    const startIndex = years.indexOf(CURRENT_YEAR);

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

        segment: {
          borderDash: (ctx) =>
            startIndex >= 0 && ctx.p0DataIndex >= startIndex
              ? [6, 5]
              : undefined,
        },
      };
    });

    const chart = new Chart(canvasRef.current, {
      type: "line",

      data: {
        labels: years,
        datasets,
      },

      plugins: [projectionPlugin],

      options: {
        responsive: true,
        maintainAspectRatio: false,

        animation: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? false
          : { duration: 450 },

        interaction: {
          mode: "index",
          intersect: false,
        },

        layout: {
          padding: { top: 4 },
        },

        plugins: {
          legend: {
            display: false,
          },

          projection: {
            startIndex,
            label: chartText.projection,
          },

          tooltip: {
            backgroundColor: "#0b2a20",
            padding: 12,
            cornerRadius: 10,
            titleFont: {
              family: "Inter",
              weight: "600",
            },
            bodyFont: {
              family: "Inter",
            },
            usePointStyle: true,

            callbacks: {
              title: (context) =>
                `${context[0].label}${
                  +context[0].label > CURRENT_YEAR
                    ? ` (${chartText.projected})`
                    : ""
                }`,

              label: (context) =>
                ` ${context.dataset.label}: ${fmt1(
                  context.parsed.y
                )} ${unit}`,
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              color: grid,
            },
            ticks: {
              color: muted,
              font: {
                family: "Inter",
                size: 12,
              },
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: grid,
            },

            border: {
              display: false,
            },

            ticks: {
              color: muted,
              font: {
                family: "Inter",
                size: 12,
              },
              maxTicksLimit: 6,
              callback: (value) => fmtShort(value),
            },

            title: {
              display: true,
              text: `${meta.title} (${UNITS[metric]})`,
              color: muted,
              font: {
                family: "Inter",
                size: 12,
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [sets, metric, meta, colours, themeTick, chartText]);

  const anyEstimated = sets.some((set) => set.estimated);

  if (sets.length === 0) return null;

  const chartDescription = `${chartText.chartDescriptionStart} ${meta.title.toLowerCase()} ${chartText.chartDescriptionMiddle} ${sets
    .map((s) => s.model.name)
    .join(", ")}`;

  return (
    <>
      <div className="legend">
        {sets.map(({ model, slot }) => (
          <span className="legend-item" key={model.id}>
            <LegendMark
              shape={POINT_STYLES[slot]}
              colour={colours[slot]}
            />
            {model.name}
          </span>
        ))}

        <span className="legend-item">
          <span className="legend-line" />
          <T>Actual</T>
        </span>

        <span className="legend-item">
          <span className="legend-line dashed" />
          <T>Projected (illustrative)</T>
        </span>
      </div>

      <div className="chart-box">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={chartDescription}
        />
      </div>

      {anyEstimated && (
        <p className="card-sub">
          <T>
            Illustrative trend: yearly figures are estimated from each
            model's current value until real yearly data is available.
          </T>
        </p>
      )}

      <table className="sr-only">
        <caption>
          <T>{meta.title}</T> ({UNITS[metric]})
        </caption>

        <thead>
          <tr>
            <th scope="col">
              <T>Year</T>
            </th>

            {sets.map(({ model }) => (
              <th scope="col" key={model.id}>
                {model.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sets[0].years.map((year, i) => (
            <tr key={year}>
              <th scope="row">
                {year}
                {year > CURRENT_YEAR
                  ? ` (${chartText.projected})`
                  : ""}
              </th>

              {sets.map(({ model, values }) => (
                <td key={model.id}>
                  {values[i] == null
                    ? chartText.noData
                    : fmt1(values[i])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}