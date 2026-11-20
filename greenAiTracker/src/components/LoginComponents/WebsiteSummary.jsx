
import { Droplet, Zap, Cloud } from "lucide-react";
import { T } from "../../context/TranslationContext";

const features = [
  {
    icon: Droplet,
    color: "--water",
    title: "Water",
    text: "See how much water AI models use.",
  },
  {
    icon: Zap,
    color: "--energy",
    title: "Energy",
    text: "Track electricity consumption.",
  },
  {
    icon: Cloud,
    color: "--co2",
    title: "CO₂",
    text: "Understand climate impact.",
  },
];

export default function LoginSummaryCard() {
  return (
    <section className="card auth-hero" aria-labelledby="hero-title">
      <svg
        className="globe"
        viewBox="0 0 140 140"
        aria-hidden="true"
      >
        <circle cx="62" cy="76" r="52" fill="var(--green-900)" />

        <path
          d="M30 52c8-4 14 2 20-2s4-12 14-10 8 10 2 16-14 4-16 12 8 10 4 18-12 2-18-4-10-24-6-30zM76 70c6-2 14 0 16 8s-4 16-10 20-8-4-8-10-4-16 2-18zM58 104c4-2 10 0 10 4s-6 6-10 4-2-6 0-8z"
          fill="var(--green-300)"
          opacity=".9"
        />

        <ellipse
          cx="62"
          cy="76"
          rx="52"
          ry="18"
          fill="none"
          stroke="var(--green-300)"
          strokeOpacity=".25"
          strokeWidth="1.5"
        />

        <path
          d="M88 38c10-20 30-26 44-24-2 16-10 34-30 40-8 2-14-2-14-16z"
          fill="var(--green-600)"
          stroke="var(--surface)"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <path
          d="M92 52c8-10 18-20 32-30"
          stroke="var(--green-900)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <h2 id="hero-title">
        <T>Make more sustainable AI choices</T>
      </h2>

      <p>
        <T>
          Compare the water, energy and CO₂ impact of AI models to make informed, more sustainable decisions.
        </T>
      </p>

      <div className="auth-features">
        {features.map(({ icon: Icon, color, title, text }) => (
          <div
            className="auth-feature"
            key={title}
            style={{ "--c": `var(${color})` }}
          >
            <div className="stat-icon">
              <Icon className="icon icon-sm" />
            </div>

            <strong><T>{title}</T></strong>
            <span><T>{text}</T></span>
          </div>
        ))}
      </div>
    </section>
  );
}
