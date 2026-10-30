import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Rankings from "./pages/Rankings";
import Information from "./pages/Information";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/information" element={<Information />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}