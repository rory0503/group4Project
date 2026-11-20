import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { T } from "../context/TranslationContext";

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        <T>Skip to content</T>
      </a>

      <Header />

      <Outlet />

      <Footer />
    </>
  );
}
