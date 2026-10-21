import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const PATHS = { bundles: "/api/v1/bundles" };
const events = [
  { time: "09:14:02", title: "Peer session reset", detail: "AS64512 · edge-router-02", kind: "event" },
  { time: "09:14:08", title: "Route withdrawal", detail: "198.51.100.0/24 · peer AS64512", kind: "warning" },
  { time: "09:14:19", title: "Traffic recovered", detail: "Path restored through AS64520", kind: "success" },
];

function App() {
  const [position, setPosition] = useState(0);
  const [seed, setSeed] = useState(41);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [bundles, setBundles] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const score = ((seed * 17) % 29) + 61;

  async function loadBundles() {
    setMessage("Connecting to local ReplayNet API…");
    try {
      const response = await fetch(`http://127.0.0.1:8000${PATHS.bundles}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || `API returned ${response.status}`);
      setBundles(body);
      setMessage(`${body.length} bundle${body.length === 1 ? "" : "s"} loaded from local API.`);
    } catch (error) {
      setMessage(`${error.message}. The timeline below is sample data.`);
    }
  }

  return <main>
    <header><a className="brand" href="#top"><span className="mark">RN</span> ReplayNet</a><span className="eyebrow">OFFLINE INCIDENT LAB</span><a href="#pipeline">Pipeline</a></header>
    <section className="hero" id="top"><p className="eyebrow">NETWORK INCIDENT ENGINEERING</p><h1>Turn one incident<br/><em>into a repeatable test.</em></h1><p>Inspect sanitized evidence, step through the timeline, and compare seeded simulator trials.</p></section>
    <section className="workspace" aria-label="Incident evidence and replay">
      <div className="panel evidence"><div className="panel-head"><div><p className="eyebrow">01 / EVIDENCE</p><h2>Incident timeline</h2></div><span className="pill">Example bundle</span></div>
        <div className="scrub"><label htmlFor="timeline">Scrub the replay</label><output>{events[position].time} UTC</output><input id="timeline" type="range" min="0" max={events.length - 1} value={position} onChange={event => setPosition(Number(event.target.value))}/></div>
        <div className="events">{events.map((event, index) => <button key={event.time} className={`event ${event.kind} ${index === position ? "selected" : ""}`} onClick={() => setPosition(index)} aria-pressed={index === position}><span className="event-time">{event.time}</span><span><b>{event.title}</b><small>{event.detail}</small></span><span className="event-mark" aria-hidden="true">{index < position ? "✓" : "·"}</span></button>)}</div>
        <div className="redaction"><div><p className="eyebrow">PRIVACY CHECK</p><b>{revealed ? "Identifiers are visible in this local demo" : "Sensitive values are redacted"}</b><p>Evidence is sanitized before scenario generation.</p></div><button className="button secondary" onClick={() => setRevealed(!revealed)}>{revealed ? "Hide values" : "Preview redaction"}</button></div>
      </div>
      <aside className="panel trial"><p className="eyebrow">02 / SEEDED TRIALS</p><h2>Repeatable by design</h2><p className="subtle">Change the seed to reproduce a different deterministic simulator run.</p><div className="score"><strong>{score}%</strong><span>scenario pass rate</span></div><div className="meter"><span style={{ width: `${score}%` }}/></div><div className="interval"><span>Approx. 95% interval</span><b>{Math.max(0, score - 12)}–{Math.min(100, score + 12)}%</b></div><label className="seed">Run seed<input type="number" value={seed} onChange={event => setSeed(Number(event.target.value) || 0)}/></label><p className="footnote">Illustrative local data. The in-process simulator does not send live packets or change a network.</p></aside>
    </section>
    <section className="connection" id="pipeline"><div><p className="eyebrow">OPTIONAL LOCAL API</p><h2>Load your saved bundles</h2><p>Connect to the locally running service to view stored evidence.</p>{message && <p className="notice" role="status">{message}</p>}</div><div className="connect-controls"><label className="seed">Viewer token<input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="local viewer token" autoComplete="off"/></label><button className="button" onClick={loadBundles}>Load bundles</button>{bundles.length > 0 && <span className="subtle">{bundles.length} stored</span>}</div></section>
    <footer>ReplayNet <span>Evidence stays local · Simulator only</span></footer>
  </main>;
}

createRoot(document.getElementById("root")).render(<App/>);
