import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Info, Target, TrendingUp, BookOpen, Mail
} from "lucide-react";
import { tips } from "../data/models";
import {
  metricCards, aims, scoreBands, sources, contact
} from "../data/userInformation";
import Accordion from "../components/InformationComponents/Accordion";
import "../styles/information.css";

export default function Information() {
  const { hash } = useLocation();
  const [sourcesOpen, setSourcesOpen] = useState(hash === "#sources");

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
            <p>
              Learn how AI affects the environment, what we measure
              and where our research comes from.
            </p>
          </div>
        </div>

        <div className="info-hero">

          <section className="card prose" aria-labelledby="basic-title">
            <h2 className="card-title" id="basic-title">
              <Info className="icon" />
              Basic information
            </h2>

            <p className="lead">
              Understand the environmental impact of artificial intelligence.
            </p>

            <p style={{ marginTop: 12 }}>
              AI relies on powerful computers and data centres to train
              and run models. These facilities require electricity and
              may use water for cooling. The production of computer
              equipment also requires natural resources, while its
              disposal can contribute to electronic waste [1][2][3].
            </p>

            <p>
              Green AI Tracker helps you compare estimated energy use,
              water consumption and carbon emissions across AI models.
              These figures are estimates rather than exact measurements,
              because environmental impact can vary depending on the
              task, hardware, data-centre location and electricity source
              [2][3][5].
            </p>

            <p>
              Our aim is to make this information easier to understand,
              helping users consider the environmental cost of their
              everyday AI use.
            </p>

            <div className="metric-cards">
              {metricCards.map(({ key, color, icon: Icon, title, text }) => (
                <div
                  className="metric-card"
                  key={key}
                  style={{ "--c": `var(${color})` }}
                >
                  <span className="stat-icon">
                    <Icon className="icon icon-sm" />
                  </span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="aims-title">
            <h2 className="card-title" id="aims-title">
              <Target className="icon" />
              Our aims
            </h2>

            <ul className="aims">
              {aims.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="aim-icon">
                    <Icon className="icon icon-sm" />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section
          className="section card"
          id="methodology"
          aria-labelledby="method-title"
        >
          <h2 className="card-title" id="method-title">
            <TrendingUp className="icon" />
            How the score works
          </h2>

          <p className="card-sub" style={{ fontSize: 15, maxWidth: 760 }}>
            Each AI model receives a sustainability score out of 30.
            The score is divided into three categories: water, energy
            and CO₂ emissions, with up to 10 points available in each.
            Models with lower estimated resource consumption receive
            higher scores. This makes it easier to compare the
            environmental performance of different models.

            Our scoring system is an internal comparison method
            developed for Green AI Tracker. It is not an official
            environmental rating or certification. The ITU highlights
            the importance of transparent and consistent methods for
            assessing the environmental impact of AI [5].
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

          <p className="card-sub">
            Small changes in how we use AI can help reduce unnecessary
            computing and resource consumption. Here are some ways
            to make more considered choices.
          </p>

          <ul className="tips-list">
            {tips.map((tip, i) => (
              <li key={tip.title}>
                <strong>{i + 1}. {tip.title}</strong>
                <span>{tip.body}</span>
              </li>
            ))}
          </ul>

          <p className="card-sub" style={{ marginTop: 12 }}>
            These tips are practical suggestions for avoiding unnecessary
            AI use. The actual environmental savings will vary depending
            on the model, task and infrastructure.
          </p>
        </section>

        <section className="section" id="faqs" aria-labelledby="faq-title">
          <div className="section-head">
            <h2 id="faq-title">Frequently asked questions</h2>
          </div>

          <Accordion summary="What metrics can I compare across models?" defaultOpen>
            You can compare estimated water consumption, energy use
            and CO₂ emissions, alongside an overall sustainability
            score. These measurements represent some of the direct
            environmental impacts associated with AI systems [1][3].
          </Accordion>

          <Accordion summary="How many models can I compare at once?">
            You can compare up to 3 AI models side by side on our
            <Link to="/compare"> Compare </Link>
            page. This makes it easier to see differences in their
            estimated environmental impact.
          </Accordion>

          <Accordion summary="What format can I export data in?">
            You can export the available comparison data in CSV format.
            This file can be opened using programmes such as Microsoft
            Excel, Google Sheets and Apple Numbers.
          </Accordion>

          <Accordion summary="Are the environmental figures exact?">
            No. Environmental figures should be treated as estimates
            rather than exact measurements. Energy use and emissions
            can vary depending on the model, task, hardware, data-centre
            location and electricity source. The ITU identifies gaps
            in current measurement approaches, including the use of
            indirect estimates and inconsistent methods [3][5].
          </Accordion>

          <Accordion summary="Why does AI use so much energy and water?">
            AI models run on computers in data centres. These computers
            need electricity to operate and cooling systems to manage
            the heat they produce. Depending on the facility and its
            cooling method, this can also involve water consumption
            [1][2][4].
          </Accordion>

          <Accordion summary="Can AI also help the environment?">
            Yes. AI can support environmental research, climate
            monitoring and the management of natural resources.
            However, these potential benefits need to be considered
            alongside the resources required to develop and operate
            AI systems [1][3].
          </Accordion>

          <Accordion summary="Do I need an account?">
            No. You can browse the website without creating an account.
            An account allows you to save favourite models and set
            your default metric and time range.
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
                <BookOpen className="icon" />
                Sources and references
              </span>
            }
          >
            <p style={{ marginBottom: 16 }}>
              The information on this page is informed by research
              and publications from environmental organisations
              and international institutions. The numbered references
              throughout the page correspond to the sources below.
            </p>

            <ol className="sources">
              {sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.title}
                  </a>
                  <span className="src-meta">{s.meta}</span>
                </li>
              ))}
            </ol>
          </Accordion>
        </section>

        <section className="section card" id="contact" aria-labelledby="contact-title">
          <h2 className="card-title" id="contact-title">
            <Mail className="icon" />
            Contact information
          </h2>

          <p className="card-sub">
            Have a question, spotted an error or want to suggest
            an improvement? Get in touch with us.
          </p>

          <div className="contact-list grid-2">
            {contact.map(({ icon: Icon, label, value, href }) => (
              <a className="contact-item" href={href} key={label}>
                <span className="stat-icon">
                  <Icon className="icon icon-sm" />
                </span>
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
