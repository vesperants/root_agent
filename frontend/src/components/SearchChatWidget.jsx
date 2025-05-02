import React from "react";

// Pure display widget for showing a list of case titles
export default function SearchChatWidget({ results }) {
  // If no results, render nothing
  if (!results || results.length === 0) return null;

  return (
    <div
      style={{
        background: "#F6F8FB",
        borderRadius: 12,
        boxShadow: "0 2px 16px #0002",
        maxWidth: 400,
        width: "100%",
        margin: "10px 0 0 0",
        padding: "10px 16px 16px 16px",
        fontFamily: "Inter, Arial, sans-serif",
        border: "1px solid #eaeaea",
      }}
    >
      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #eee",
          padding: "5px 3px",
          minHeight: 30,
        }}
      >
        {results.map((r, idx) => (
          <div
            key={idx}
            style={{
              padding: "7px 3px 6px 3px",
              borderBottom: "1px solid #f3f5fa",
              fontSize: 15,
              marginBottom: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#2154b6",
                fontWeight: 500,
                fontSize: 15.5,
                wordBreak: "break-all",
              }}
              title={r.title}
            >
              {r.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 