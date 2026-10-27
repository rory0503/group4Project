import { Link } from "react-router-dom";
import { Leaf } from "lucide-react"; //leaf icon in footer

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="brand" to="/">
              <span className="brand-mark"><Leaf className="icon icon-sm" /></span>
              <span>Green AI Tracker</span>
            </Link>
            <p>Track and compare the water, energy and carbon footprint of AI models — and make more sustainable choices.</p>
          </div>
          <div>
            <h2>Explore</h2>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/rankings">Rankings</Link></li>
              <li><Link to="/compare">Compare models</Link></li>
            </ul>
          </div>
          <div>
            <h2>About</h2>
            <ul>
              <li><Link to="/information#sources">Source list</Link></li>
              <li><Link to="/information#methodology">How scores work</Link></li>
              <li><Link to="/information#contact">Contact information</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Green AI Tracker</span>
          <span>Figures shown are illustrative estimates and vary by task and infrastructure.</span>
        </div>
      </div>
    </footer>
  );
}