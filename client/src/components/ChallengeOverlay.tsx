import { useEffect, useState, useRef } from "react";
import type { ChallengeVisual } from "../types";
import { Card } from "./Card";
import { playCardFlip, playCorrect, playWrong } from "../sounds";

// Particle burst for correct/incorrect
function ParticleBurst({ correct }: { correct: boolean }) {
  const count = 28;
  return (
    <div className="challenge-particles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i + (Math.random() * 20 - 10);
        const distance = 120 + Math.random() * 180;
        const size = 3 + Math.random() * 5;
        const delay = Math.random() * 0.15;
        const duration = 0.6 + Math.random() * 0.5;
        return (
          <span
            key={i}
            className={`challenge-particle ${correct ? "particle-correct" : "particle-wrong"}`}
            style={{
              "--angle": `${angle}deg`,
              "--distance": `${distance}px`,
              "--size": `${size}px`,
              "--delay": `${delay}s`,
              "--duration": `${duration}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// Radial shockwave ring
function ShockwaveRing({ correct }: { correct: boolean }) {
  return (
    <div className="shockwave-container" aria-hidden="true">
      <div className={`shockwave-ring ${correct ? "shockwave-correct" : "shockwave-wrong"}`} />
      <div className={`shockwave-ring shockwave-ring-2 ${correct ? "shockwave-correct" : "shockwave-wrong"}`} />
    </div>
  );
}

// Animated check/cross icon
function ResultIcon({ correct }: { correct: boolean }) {
  if (correct) {
    return (
      <div className="result-icon result-icon-correct">
        <svg viewBox="0 0 52 52" className="result-check-svg">
          <circle className="result-check-circle" cx="26" cy="26" r="24" fill="none" />
          <path className="result-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
    );
  }
  return (
    <div className="result-icon result-icon-wrong">
      <svg viewBox="0 0 52 52" className="result-cross-svg">
        <circle className="result-cross-circle" cx="26" cy="26" r="24" fill="none" />
        <path className="result-cross-path" fill="none" d="M16 16 36 36" />
        <path className="result-cross-path result-cross-path-2" fill="none" d="M36 16 16 36" />
      </svg>
    </div>
  );
}

// Floating sparkles (for correct)
function Sparkles() {
  return (
    <div className="challenge-sparkles" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="challenge-sparkle"
          style={{
            "--sx": `${Math.random() * 200 - 100}px`,
            "--sy": `${Math.random() * 200 - 100}px`,
            "--sd": `${0.1 + Math.random() * 0.3}s`,
            "--ss": `${0.4 + Math.random() * 0.4}`,
          } as React.CSSProperties}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export function ChallengeOverlay({ result }: { result: ChallengeVisual | null }) {
  const [flipped, setFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFlipped(false);
    setShowResult(false);
    if (!result) return;

    // Flip card first
    playCardFlip();
    const flipFrame = requestAnimationFrame(() => setFlipped(true));

    // Show result badge after flip completes
    const resultTimer = window.setTimeout(() => {
      setShowResult(true);
      if (result.correct) playCorrect();
      else playWrong();
    }, 500);

    // Screen shake for wrong answer
    if (!result.correct) {
      const shakeTimer = window.setTimeout(() => {
        overlayRef.current?.classList.add("challenge-shake");
        window.setTimeout(() => {
          overlayRef.current?.classList.remove("challenge-shake");
        }, 600);
      }, 480);
      return () => {
        cancelAnimationFrame(flipFrame);
        clearTimeout(resultTimer);
        clearTimeout(shakeTimer);
      };
    }

    return () => {
      cancelAnimationFrame(flipFrame);
      clearTimeout(resultTimer);
    };
  }, [result]);

  if (!result) return null;

  return (
    <div
      ref={overlayRef}
      className={`challenge-overlay pointer-events-none fixed inset-0 z-50 flex items-center justify-center ${
        result.correct ? "challenge-bg-correct" : "challenge-bg-wrong"
      }`}
    >
      {/* Background flash */}
      <div className={`challenge-flash ${result.correct ? "flash-correct" : "flash-wrong"}`} />

      <div className={`challenge-content flex flex-col items-center gap-5 ${result.correct ? "" : "animate-return-card"}`}>
        {/* Shockwave */}
        {showResult && <ShockwaveRing correct={result.correct} />}

        {/* Particles */}
        {showResult && <ParticleBurst correct={result.correct} />}

        {/* Sparkles (correct only) */}
        {showResult && result.correct && <Sparkles />}

        {/* Card with glow */}
        <div className={`challenge-card-wrapper ${showResult ? (result.correct ? "card-glow-correct" : "card-glow-wrong") : ""}`}>
          <Card card={result.card} showBack={flipped} year={result.year} className="w-40 sm:w-48" />
        </div>

        {/* Result badge */}
        {showResult && (
          <div className={`challenge-result-badge ${result.correct ? "badge-correct" : "badge-wrong"}`}>
            <ResultIcon correct={result.correct} />
            <div className="badge-text">
              <strong>{result.correct ? "ĐÚNG!" : "SAI!"}</strong>
              <span>
                {result.correct
                  ? "Vị trí chính xác"
                  : `${result.drawerName} bốc thêm 1 thẻ`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
