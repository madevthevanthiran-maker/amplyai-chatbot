// /components/PromptBar.jsx
import { useEffect, useRef, useState } from "react";

export default function PromptBar({ presets = [], onInsert }) {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);

  const itemsPerPage = 7; // show 7 buttons at a time
  const totalPages = Math.ceil(presets.length / itemsPerPage);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [presets]);

  const handleScrollLeft = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleScrollRight = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const visiblePresets = presets.slice(start, end);

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleScrollLeft} className="text-xl px-2">←</button>
      <div
        ref={scrollRef}
        className="flex overflow-hidden gap-2 w-full"
      >
        {visiblePresets.map((text, i) => (
          <button
            key={i}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1 rounded-full text-sm whitespace-nowrap"
            onClick={() => onInsert(text)}
          >
            {text.length > 40 ? text.slice(0, 40) + "..." : text}
          </button>
        ))}
      </div>
      <button onClick={handleScrollRight} className="text-xl px-2">→</button>
    </div>
  );
}
