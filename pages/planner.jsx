// pages/planner.jsx
import Link from "next/link";
import { useState } from "react";

export default function Planner(){
  const [start, setStart] = useState("");
  const [hours, setHours] = useState(3);
  const [days, setDays] = useState(["Mon","Tue","Wed","Thu","Fri"]);
  const [tasks, setTasks] = useState([
    { name:"Revise Chapter 3", hours:2, due:"" },
    { name:"Prepare portfolio piece", hours:4, due:"" },
    { name:"Apply to Acme internship", hours:3, due:"" }
  ]);

  function toggleDay(d){
    setDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);
  }

  function addTask(){
    setTasks(prev => [...prev, { name:"New Task", hours:1, due:"" }]);
  }

  function removeTask(i){
    setTasks(prev => prev.filter((_,idx)=>idx!==i));
  }

  return (
    <main className="app">
      <div className="backbar">
        <Link href="/">← Back to Progress Partner</Link>
        <Link className="pill-link" href="/email">MailMate</Link>
        <Link className="pill-link" href="/hire-helper">HireHelper</Link>
      </div>

      <div className="page">
        <h2 className="section-title">AmplyAI — Planner</h2>

        <div className="grid">
          <div className="full" style={{color:"var(--muted)"}}>Availability & Settings</div>
          <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
          <input type="number" min={1} max={12} value={hours} onChange={(e)=>setHours(Number(e.target.value))} />
          <div className="full" style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <button
                key={d}
                type="button"
                onClick={()=>toggleDay(d)}
                className="pill-link"
                style={{borderColor: days.includes(d) ? "#2563eb" : "var(--border)"}}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="full" style={{color:"var(--muted)", marginTop:8}}>Tasks & Deadlines</div>

          {tasks.map((t, i)=>(
            <div key={i} className="grid full" style={{gridTemplateColumns:"2fr 120px 160px auto", alignItems:"center"}}>
              <input
                type="text"
                value={t.name}
                onChange={(e)=>setTasks(prev => prev.map((x,idx)=> idx===i ? {...x, name:e.target.value} : x))}
                placeholder="Task name"
              />
              <input
                type="number"
                min={1}
                max={12}
                value={t.hours}
                onChange={(e)=>setTasks(prev => prev.map((x,idx)=> idx===i ? {...x, hours:Number(e.target.value)} : x))}
                placeholder="Hours"
              />
              <input
                type="date"
                value={t.due}
                onChange={(e)=>setTasks(prev => prev.map((x,idx)=> idx===i ? {...x, due:e.target.value} : x))}
                placeholder="Due date"
              />
              <button type="button" className="pill-link" onClick={()=>removeTask(i)}>Remove</button>
            </div>
          ))}

          <div className="full" style={{marginTop:8}}>
            <button type="button" className="btn" onClick={addTask}>+ Add task</button>
          </div>
        </div>

        <div style={{marginTop:16}} className="preview">
          <strong>Your availability:</strong> {hours}h/day • {days.join(", ")}
          <div><strong>Start:</strong> {start || "—"}</div>
          <div style={{marginTop:8}}><strong>Tasks:</strong></div>
          <ul style={{marginTop:4}}>
            {tasks.map((t,i)=>(
              <li key={i}>{t.name} — {t.hours}h {t.due ? ` • due ${t.due}` : ""}</li>
            ))}
          </ul>
          <div style={{color:"var(--muted)", marginTop:10}}>(Implement auto-scheduling later.)</div>
        </div>
      </div>
    </main>
  );
}
