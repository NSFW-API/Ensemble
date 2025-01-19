import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RepoListPage() {
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  
  // For manual entry of a repo name
  const [userRepo, setUserRepo] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const resp = await fetch("/api/repos");
        if (resp.ok) {
          const data = await resp.json();
          setRepos(data);
        } else {
          setError("Failed to fetch repos");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchRepos();
  }, []);

  const handleManualRepo = (e) => {
    e.preventDefault();
    // e.g. if userRepo is "ox/CatDogBBox", navigate to /repos/ox/CatDogBBox
    if (userRepo.trim()) {
      navigate(`/repos/${userRepo}`);
    }
  };

  return (
    <div style={{ margin: "2rem" }}>
      <h1>My Oxen Repositories</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {/* List of user-owned or accessible repos */}
      <ul>
        {Array.isArray(repos) && repos.map((repo, idx) => (
          <li key={idx}>
            <a href={`/repos/${repo.namespace}/${repo.name}`}>
              {repo.namespace}/{repo.name}
            </a>
          </li>
        ))}
      </ul>

      {/* If the user sees no repos, or wants to open some other repo */}
      <div style={{ marginTop: "2rem" }}>
        <h2>Browse Another Repository</h2>
        <p>Enter “namespace/repo”, e.g. “ox/CatDogBBox”</p>
        <form onSubmit={handleManualRepo}>
          <input
            type="text"
            value={userRepo}
            onChange={(e) => setUserRepo(e.target.value)}
            placeholder="namespace/repo"
            style={{ width: "300px", marginRight: "1rem" }}
          />
          <button type="submit">Go</button>
        </form>
      </div>
    </div>
  );
}

export default RepoListPage;
