import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [token, setToken] = useState("");
  const [bundles, setBundles] = useState([]);
  const [message, setMessage] = useState("Local API not connected");
  async function load() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/bundles",
        {headers:{Authorization:"Bearer " + token}});
      if (!response.ok) throw new Error(response.status === 401 ? "Token rejected" : "API request failed");
      setBundles(await response.json()); setMessage("Connected to offline lab");
    } catch (error) { setMessage(error.message); }
  }
  return <main><header><b>RN <span>REPLAYNET</span></b><small>OFFLINE INCIDENT LAB</small></header>
    <section className="hero"><small>NETWORK INCIDENT ENGINEERING</small><h1>Make incidents<br/><em>repeatable.</em></h1>
      <p>Transform sanitized evidence into a measurable network regression scenario.</p></section>
    <section className="stats"><div><small>LAB MODE</small><strong>In-process simulator</strong></div><div><small>VERDICT</small><strong>Measured oracle</strong></div><div><small>STATUS</small><strong>{message}</strong></div></section>
    <section className="content"><div><div className="title"><div><small>01 / EVIDENCE</small><h2>Incident bundles</h2></div><button onClick={load}>Load bundles</button></div>
      <label>Local API token<input type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="Viewer or operator token"/></label>
      {bundles.length ? bundles.map(item=><article className="bundle" key={item.id}><b>{item.id.slice(0,8)}</b><span>{item.events.length} events</span><code>{item.sha256.slice(0,18)}…</code></article>) : <div className="empty">No bundles loaded. Upload JSONL through the API to start.</div>}
    </div><aside><small>PIPELINE</small><ol><li>Redact evidence</li><li>Build UTC timeline</li><li>Run seeded trials</li><li>Review confidence interval</li></ol><p>Simulator only. No live packets or network changes.</p></aside></section>
    <footer>ReplayNet <span>Evidence stays on this machine · No automatic network actions</span></footer></main>;
}
createRoot(document.getElementById("root")).render(<App/>);

