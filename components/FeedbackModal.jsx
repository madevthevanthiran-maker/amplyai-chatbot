// components/FeedbackModal.jsx
import React from "react";

export default function FeedbackModal({ open, onClose, defaultBody }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Share Feedback</h2>
        <textarea
          className="w-full h-40 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm"
          defaultValue={defaultBody}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert("Thanks for your feedback! (Wire up backend later)");
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
