import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ChangeKeyBox() {
  const { setApiKey } = useContext(AuthContext);
  const [newKey, setNewKey] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      // Reuse /api/login to validate & store the new API key in your server
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newKey }),
      });
      const data = await resp.json();
      if (resp.ok) {
        // Successful login: update front-end state
        setApiKey(newKey);
        alert("API Key updated successfully!");
        setNewKey("");
      } else {
        alert(data.error || "Could not update API key");
      }
    } catch (err) {
      console.error("Error updating key:", err);
      alert("Error updating key");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
      <input
        type="text"
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        placeholder="Enter new API key"
      />
      <button type="submit">Update Key</button>
    </form>
  );
}
