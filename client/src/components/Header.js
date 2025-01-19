import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ChangeKeyBox from "./ChangeKeyBox";

export default function Header() {
  const { apiKey } = useContext(AuthContext);

  return (
    <header style={{ padding: "1rem", backgroundColor: "#eee" }}>
      <h2>Ensemble</h2>
      <p>Current API Key: {apiKey ? "(Logged in)" : "(Not set)"} </p>
      <ChangeKeyBox />
    </header>
  );
}
