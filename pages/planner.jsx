// pages/planner.jsx
import Link from "next/link";
import { useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseDate(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function dayIndex(date) {
  // 0 = Mon ... 6 = Sun
  const i = (date.getDay() + 6) % 7;
  return i;
}

export default function Planner() {
  const [available, setAvailable] = useState(
    DAYS.reduce((acc, d) => ((acc[d] = true), acc), {})
  );
  const [hoursPerDay, setHoursPerDay] = useState(3);

  const [tasks, setTasks] = useState([
    { title: "Revise Chapter 3", due: "", hours: 2 },
    { title: "Prepare portfolio piece", due: "", hours: 4 },
    { title: "Apply to Acme internship", due: "", hours: 3 },
  ]);

  const [startOn, setStartOn] = useState(() => {
    const d = new Date();
    // start next Monday if today is near week end? keep simple: start today
    return d.toISOString().slice(0, 10);
  });

  function updateTask(i, key, value) {
    setTasks((arr) => arr.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  }

  function addTask() {
    setTasks((arr) => [...arr, { title: "", due: "", hours: 1 }]);
  }

  function removeTask(i) {
    setTasks((arr) => arr.filter((_, idx) => idx !== i));
  }

  // core allocator: greedy spread across available days before each task's due
  const plan = useMemo(() => {
    // build next 14 days window (2 weeks) starting from startOn
    const startDate = parseDate(startOn) || new Date();
    const horizonDays = 14;
    const calendar = Array.from({ length: horizonDays }, (_, k) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + k);
      const dayName = DAYS[dayIndex(d)];
      const isAvail = !!available[dayName];
      return {
        date: d,
        key: d.toISOString().slice(0, 10),
        dayName,
        cap: isAvail ? hoursPerDay : 0,
        used: 0,
        slots: [],
      };
    });

    const sortedTasks = tasks
      .map((t) => ({
        ...t,
        dueDate: t.due ? parseDate(t.due) : null,
        remaining: Math.max(0, Number(t.hours) || 0),
      }))
      .filter((t) => t.title && t.remaining > 0);

    sortedTasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    });

    for (const task of sortedTasks) {
      for (let i = 0; i < calendar.length && task.remaining > 0; i++) {
        const c = calendar[i];
        // must schedule on/before due if present
        if (task.dueDate && c.date > task.dueDate) break;
        const free = Math.max(0, c.cap - c.used);
        if (free <= 0) continue;
        const assign = Math.min(free, task.remaining, 2); // chunk max 2h per day per task
        if (assign > 0) {
          c.slots.push({ title: task.title, hours: assign });
          c.used += assign;
          task.remaining -= assign;
        }
      }
    }

    return calendar.filter((d) => d.cap > 0);
  }, [available, hoursPerDay, tasks, startOn]);

  function copyPlan() {
    const lines = [];
    for (const d of plan) {
      if (d.slots.length === 0) continue;
      lines.push(`${d.key} (${d.dayName})`);
      d.slots.forEach((s) => lines.push(`  • ${s.title} — ${s.hours}h`));
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      alert("Plan copied to clipboard ✅");
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">
            AmplyAI — <span className="text-indigo-600">Planner</span>
          </h1>
          <nav className="flex gap-2">
            <Link href="/" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              ← Back to Progress Partner
            </Link>
            <Link href="/email" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              MailMate
            </Link>
            <Link href="/hire-helper" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              HireHelper
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: inputs */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Availability & Settings</h2>

            <label className="block text-sm text-gray-700">Start on</label>
            <input
              type="date"
              className="mb-3 w-full rounded-lg border px-3 py-2"
              value={startOn}
              onChange={(e) => setStartOn(e.target.value)}
            />

            <label className="block text-sm text-gray-700">Hours per available day</label>
            <input
              type="number"
              min={1}
              max={12}
              className="mb-4 w-full rounded-lg border px-3 py-2"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value || 0))}
            />

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">Days available</div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAvailable((a) => ({ ...a, [d]: !a[d] }))}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      available[d] ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="mt-6 mb-3 text-lg font-medium">Tasks & Deadlines</h2>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-12">
                  <input
                    className="sm:col-span-6 rounded-lg border px-3 py-2"
                    placeholder="Task (e.g., Revise Chapter 3)"
                    value={t.title}
                    onChange={(e) => updateTask(i, "title", e.target.value)}
                  />
                  <input
                    type="date"
                    className="sm:col-span-3 rounded-lg border px-3 py-2"
                    value={t.due}
                    onChange={(e) => updateTask(i, "due", e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    className="sm:col-span-2 rounded-lg border px-3 py-2"
                    value={t.hours}
                    onChange={(e) => updateTask(i, "hours", Number(e.target.value || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    className="sm:col-span-1 rounded-lg border px-3 py-2 hover:bg-gray-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addTask} className="rounded-lg border px-3 py-2 hover:bg-gray-50">
                + Add task
              </button>
            </div>
          </section>

          {/* Right: plan */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Your 2-week plan</h2>
              <button onClick={copyPlan} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                Copy plan
              </button>
            </div>

            <div className="space-y-4">
              {plan.map((d) => (
                <div key={d.key} className="rounded-xl border p-3">
                  <div className="mb-2 text-sm font-semibold">
                    {d.key} ({d.dayName}) — {d.used}/{d.cap}h
                  </div>
                  {d.slots.length === 0 ? (
                    <div className="text-sm text-gray-500">No tasks scheduled.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {d.slots.map((s, i) => (
                        <li key={i}>
                          {s.title} — <strong>{s.hours}h</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Tip: hours are chunked in ≤2h blocks per task to avoid burnout. Adjust tasks/days and the plan will
              update instantly.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
