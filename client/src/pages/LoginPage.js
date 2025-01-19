import React, { useState } from "react";

function LoginPage() {
  const [apiKey, setApiKey] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await resp.json();
      if (resp.ok) {
        // On success, navigate to /repos
        window.location.href = "/repos";
      } else {
        alert(data.error || "Failed to log in");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ margin: "2rem" }}>
      <h1>Oxen Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Enter Oxen API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: "300px" }}
        />
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default LoginPage;
