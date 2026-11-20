import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { T } from "../context/TranslationContext";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="brand" to="/">
              <span className="brand-mark">
                <Leaf className="icon icon-sm" />
              </span>
              <span>Green AI Tracker</span>
            </Link>

            <p>
              <T>
                Track and compare the water, energy and carbon footprint of AI models — and make more sustainable choices.
              </T>
            </p>
          </div>

          <div>
            <h2>
              <T>Explore</T>
            </h2>

            <ul>
              <li>
                <Link to="/">
                  <T>Dashboard</T>
                </Link>
              </li>
              <li>
                <Link to="/rankings">
                  <T>Rankings</T>
                </Link>
              </li>
              <li>
                <Link to="/compare">
                  <T>Compare models</T>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>
              <T>About</T>
            </h2>

            <ul>
              <li>
                <Link to="/information#sources">
                  <T>Source list</T>
                </Link>
              </li>
              <li>
                <Link to="/information#methodology">
                  <T>How scores work</T>
                </Link>
              </li>
              <li>
                <Link to="/information#contact">
                  <T>Contact information</T>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Green AI Tracker
          </span>

          <span>
            <T>
              Figures shown are illustrative estimates and vary by task and infrastructure.
            </T>
          </span>
        </div>
      </div>
    </footer>
  );
}
