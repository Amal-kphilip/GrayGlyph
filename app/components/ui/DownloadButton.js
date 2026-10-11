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
    [STATUS_IDLE]: "border-[#d71920] bg-[#d71920] text-white hover:border-[#b9151b] hover:bg-[#b9151b]",
    [STATUS_LOADING]: "cursor-wait border-[#d2d0cc] bg-[#ecebe8] text-[#555555]",
    [STATUS_SUCCESS]: "border-[#b9d9c1] bg-[#edf7f0] text-[#20633a]",
    [STATUS_ERROR]: "border-[#e5a8aa] bg-[#fff1f1] text-[#8f1016]"
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
        "inline-flex min-w-[10.5rem] items-center justify-center gap-2 rounded-[2px] border px-4 py-2 text-sm font-extrabold uppercase tracking-wide shadow-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d71920]/40",
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
