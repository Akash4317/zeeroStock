import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import DatabasePage from "./pages/DatabasePage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-zero">ZEERO</span>
              <span className="logo-stock">STOCK</span>
            </div>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Search Inventory
              </NavLink>
              <NavLink to="/database" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Manage Database
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/database" element={<DatabasePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
