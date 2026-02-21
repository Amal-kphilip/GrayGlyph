"use client";

import { AlertTriangle, Check, Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STATUS_IDLE = "idle";
const STATUS_LOADING = "loading";
const STATUS_SUCCESS = "success";
const STATUS_ERROR = "error";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

export default function DownloadButton({
  fileBlob = null,
  filename = "grayglyph-export.png",
  className = "",
  disabled = false,
  onGenerateBlob,
  idleText = "Download",
  loadingText = "Preparing...",
  successText = "Downloaded",
  errorText = "Download failed",
  ...props
}) {
  const [status, setStatus] = useState(STATUS_IDLE);
  const resetTimerRef = useRef(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  const setTimedStatus = useCallback(
    (nextStatus, delay) => {
      clearResetTimer();
      setStatus(nextStatus);
      if (delay > 0) {
        resetTimerRef.current = window.setTimeout(() => {
          setStatus(STATUS_IDLE);
          resetTimerRef.current = null;
        }, delay);
      }
    },
    [clearResetTimer]
  );

  const handleClick = useCallback(async () => {
    if (disabled || status === STATUS_LOADING) {
      return;
    }

    setStatus(STATUS_LOADING);

    try {
      const result = onGenerateBlob ? await onGenerateBlob() : fileBlob;

      let blob = result;
      let nextFilename = filename;

      if (
        result &&
        typeof result === "object" &&
        !isBlob(result) &&
        Object.prototype.hasOwnProperty.call(result, "blob")
      ) {
        blob = result.blob;
        if (result.filename) {
          nextFilename = result.filename;
        }
      }

      if (!isBlob(blob)) {
        throw new Error("Download source is not a Blob.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = nextFilename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);

      setTimedStatus(STATUS_SUCCESS, 1500);
    } catch (error) {
      console.error("Download failed", error);
      setTimedStatus(STATUS_ERROR, 2000);
    }
  }, [disabled, fileBlob, filename, onGenerateBlob, setTimedStatus, status]);

  const isBusy = status === STATUS_LOADING;
  const isDisabled = disabled || isBusy;

  const stateClasses = {
    [STATUS_IDLE]:
      "border-[rgba(148,163,184,0.45)] bg-[linear-gradient(130deg,rgba(30,41,59,0.64),rgba(15,23,42,0.76))] text-[var(--text-primary)] hover:border-indigo-300/50 hover:shadow-[0_0_0_1px_rgba(129,140,248,0.2),0_10px_24px_rgba(37,99,235,0.2)]",
    [STATUS_LOADING]:
      "cursor-not-allowed border-[rgba(148,163,184,0.38)] bg-[linear-gradient(130deg,rgba(30,41,59,0.6),rgba(15,23,42,0.72))] text-[var(--text-secondary)] opacity-85",
    [STATUS_SUCCESS]:
      "border-emerald-300/60 bg-[linear-gradient(130deg,rgba(16,185,129,0.28),rgba(5,46,22,0.82))] text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_10px_28px_rgba(5,150,105,0.35)]",
    [STATUS_ERROR]:
      "border-rose-300/55 bg-[linear-gradient(130deg,rgba(239,68,68,0.22),rgba(69,10,10,0.82))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.28),0_10px_28px_rgba(127,29,29,0.4)]"
  };

  const label = {
    [STATUS_IDLE]: idleText,
    [STATUS_LOADING]: loadingText,
    [STATUS_SUCCESS]: successText,
    [STATUS_ERROR]: errorText
  }[status];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isBusy}
      aria-disabled={isDisabled}
      className={cn(
        "inline-flex min-w-[10.5rem] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold tracking-wide shadow-[0_8px_22px_rgba(2,6,23,0.38)] backdrop-blur-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70",
        stateClasses[status],
        className
      )}
      {...props}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {status === STATUS_LOADING && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {status === STATUS_SUCCESS && <Check className="h-4 w-4" aria-hidden="true" />}
        {status === STATUS_ERROR && <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        {status === STATUS_IDLE && <Download className="h-4 w-4" aria-hidden="true" />}
      </span>
      <span className="inline-flex min-w-[8.5rem] justify-center">{label}</span>
    </button>
  );
}
