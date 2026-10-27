import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

export default function TipsElement({ tips }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Move to the next tip every 10 seconds, unless paused or the user prefers less motion.
  // Clicking changes `index`, which restarts the timer.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion || tips.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % tips.length), 10000);
    return () => clearInterval(timer);
  }, [paused, index, tips.length]);

  if (tips.length === 0) return null;

  const tip = tips[index];
  const go = (i) => setIndex((i + tips.length) % tips.length);

  return (
    <div
      className="card tip"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="tip-icon"><Lightbulb className="icon icon-lg" /></span>

      <div aria-live="polite">
        <h3>Tip {index + 1} — {tip.title}</h3>
        <p>{tip.body}</p>
      </div>

      <div className="tip-controls">
        <Link className="link-btn" to="/information#tips">Learn more</Link>

        <div className="dots" role="group" aria-label="Choose tip">
          {tips.map((_, i) => (
            <button
              key={i}
              className="dot"
              type="button"
              aria-label={`Tip ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <div className="tip-nav">
          <button className="page-btn" type="button" aria-label="Previous tip" onClick={() => go(index - 1)}>
            <ChevronLeft className="icon icon-sm" />
          </button>
          <button className="page-btn" type="button" aria-label="Next tip" onClick={() => go(index + 1)}>
            <ChevronRight className="icon icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}