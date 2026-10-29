/*  Ai generated information page content. Needs to be human written, 
will sound much better. The way the page is laid out is good and i like it
it just needs to be human written information about our website. */


import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Info, Target, TrendingUp, BookOpen, Mail } from "lucide-react";
import { tips } from "../data/models";
import { metricCards, aims, scoreBands, sources, contact } from "../data/userInformation";
import Accordion from "../components/InformationComponents/Accordion";
import "../styles/information.css";

export default function Information() {
  const { hash } = useLocation();
  const [sourcesOpen, setSourcesOpen] = useState(hash === "#sources");

  // Links like /information#tips scroll to that section; #sources also opens the panel
  useEffect(() => {
    if (!hash) return;
    if (hash === "#sources") setSourcesOpen(true);
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>About Green AI Tracker</h1>
            <p>What we measure, how we score models, and where our figures come from.</p>
          </div>
        </div>

        <div className="info-hero">
          <section className="card prose" aria-labelledby="basic-title">
            <h2 className="card-title" id="basic-title"><Info className="icon" />Basic information</h2>
            <p className="lead">Explore AI's environmental footprint.</p>
            <p style={{ marginTop: 12 }}>
              Compare estimated energy use, water consumption and carbon emissions across AI models.
              Estimates vary by task and infrastructure.
            </p>
            <div className="metric-cards">
              {metricCards.map(({ key, color, icon: Icon, title, text }) => (
                <div className="metric-card" key={key} style={{ "--c": `var(${color})` }}>
                  <span className="stat-icon"><Icon className="icon icon-sm" /></span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="aims-title">
            <h2 className="card-title" id="aims-title"><Target className="icon" />Our aims</h2>
            <ul className="aims">
              {aims.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="aim-icon"><Icon className="icon icon-sm" /></span>
                  <div>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="section card" id="methodology" aria-labelledby="method-title">
          <h2 className="card-title" id="method-title"><TrendingUp className="icon" />How the score works</h2>
          <p className="card-sub" style={{ fontSize: 15, maxWidth: 760 }}>
            Each model gets a sustainability score out of 30 — up to 10 points each for water, energy and CO₂.
            Lower resource use earns more points, so a higher score means a greener model.
          </p>
          <div className="score-scale">
            {scoreBands.map((band) => (
              <div key={band.range}>
                <strong>{band.range}</strong>
                {band.label}
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="tips" aria-labelledby="tips-title">
          <div className="section-head">
            <h2 id="tips-title">Tips for more sustainable AI use</h2>
          </div>
          <ul className="tips-list">
            {tips.map((tip, i) => (
              <li key={tip.title}>
                <strong>{i + 1}. {tip.title}</strong>
                <span>{tip.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="faqs" aria-labelledby="faq-title">
          <div className="section-head">
            <h2 id="faq-title">Frequently asked questions</h2>
          </div>
          <Accordion summary="What metrics can I compare across models?" defaultOpen>
            Water (litres), energy (GWh) and CO₂ (metric tonnes), plus an overall sustainability score.
          </Accordion>
          <Accordion summary="How many models can I compare at once?">
            You can compare up to 3 models side by side on the <Link to="/compare">Compare</Link> page.
          </Accordion>
          <Accordion summary="What format can I export data in?">
            Data can be exported in CSV format, which opens in Excel, Google Sheets and Numbers.
          </Accordion>
          <Accordion summary="Are these figures exact?">
            No — they are estimates. Real usage depends on the task, hardware, data-centre location and
            energy mix. Projections after the current year are illustrative.
          </Accordion>
          <Accordion summary="Do I need an account?">
            No. Everything is free to browse. An account lets you save favourite models and set your
            default metric and time range.
          </Accordion>
        </section>

        <section className="section" id="sources" aria-labelledby="sources-title">
          <Accordion
            className="card"
            style={{ padding: 0 }}
            open={sourcesOpen}
            onOpenChange={setSourcesOpen}
            summary={
              <span className="card-title" id="sources-title" style={{ fontSize: 20 }}>
                <BookOpen className="icon" />Sources
              </span>
            }
          >
            <p style={{ marginBottom: 16 }}>Listed are the sources we got our information from.</p>
            <ol className="sources">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                  <span className="src-meta">{s.meta}</span>
                </li>
              ))}
            </ol>
          </Accordion>
        </section>

        <section className="section card" id="contact" aria-labelledby="contact-title">
          <h2 className="card-title" id="contact-title"><Mail className="icon" />Contact information</h2>
          <p className="card-sub">Questions, corrections or new data? We'd love to hear from you.</p>
          <div className="contact-list grid-2">
            {contact.map(({ icon: Icon, label, value, href }) => (
              <a className="contact-item" href={href} key={label}>
                <span className="stat-icon"><Icon className="icon icon-sm" /></span>
                <span>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}