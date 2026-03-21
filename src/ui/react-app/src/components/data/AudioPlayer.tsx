import React from "react";
import type { AudioPlayerProps } from "../../types.js";

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title,
  duration,
  type = "recording",
}) => {
  const typeIcon = type === "voicemail" ? "📩" : "🎙";
  const typeLabel = type === "voicemail" ? "Voicemail" : "Recording";

  // Deterministic pseudo-wave based on index
  const bars = Array.from({ length: 32 }, (_, i) => {
    const base = Math.sin(i * 0.4) * 30 + 50;
    const jitter = ((i * 7 + 13) % 19) * 2;
    return Math.min(95, Math.max(15, Math.round(base + jitter)));
  });

  return (
    <div className="audio-player">
      <div className="audio-player-info">
        <span className="audio-player-icon">{typeIcon}</span>
        <div>
          <div className="audio-player-title">{title || typeLabel}</div>
          <div className="audio-player-type">{typeLabel}</div>
        </div>
      </div>
      <div className="audio-player-controls">
        <button className="audio-play-btn" aria-label="Play">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div className="audio-waveform">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`audio-bar ${i < 10 ? "audio-bar-played" : ""}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <span className="audio-duration">{duration || "0:00"}</span>
      </div>
    </div>
  );
};
