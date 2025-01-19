import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import RepoListPage from "./pages/RepoListPage";
import RepoDetailPage from "./pages/RepoDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/repos" element={<RepoListPage />} />
        <Route path="/repos/:namespace/:repo" element={<RepoDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
