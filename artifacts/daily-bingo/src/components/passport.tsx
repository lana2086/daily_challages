import { useState, useRef, useEffect, forwardRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import HTMLFlipBook from "react-pageflip";
import { motion } from "framer-motion";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
  type CanvasPath,
} from "react-sketch-canvas";
import {
  useGetMyPassport,
  useUpdateMyPassport,
  useGetParticipantPassport,
  getGetMyPassportQueryKey,
  getGetParticipantPassportQueryKey,
  type PassportPage,
} from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";

const PAGE_W = 320;
const PAGE_H = 460;

type FieldKey = "missionName" | "round1" | "round2" | "reflection" | "uprooting";

interface LocalPage {
  missionName: string;
  round1: string;
  round2: string;
  reflection: string;
  uprooting: string;
  drawings: Record<string, CanvasPath[]>;
}

const FIELD_KEYS: FieldKey[] = [
  "missionName",
  "round1",
  "round2",
  "reflection",
  "uprooting",
];

function toLocalPage(p?: Partial<PassportPage>): LocalPage {
  const raw = (p?.drawings ?? {}) as Record<string, unknown>;
  const draw = (k: string): CanvasPath[] =>
    Array.isArray(raw[k]) ? (raw[k] as CanvasPath[]) : [];
  return {
    missionName: p?.missionName ?? "",
    round1: p?.round1 ?? "",
    round2: p?.round2 ?? "",
    reflection: p?.reflection ?? "",
    uprooting: p?.uprooting ?? "",
    drawings: {
      missionName: draw("missionName"),
      round1: draw("round1"),
      round2: draw("round2"),
      reflection: draw("reflection"),
      uprooting: draw("uprooting"),
    },
  };
}

function normalizePages(pages?: PassportPage[]): LocalPage[] {
  const arr = Array.isArray(pages) ? pages : [];
  const out: LocalPage[] = [];
  for (let i = 0; i < 4; i++) out.push(toLocalPage(arr[i]));
  return out;
}

/* ── A single writable field: typing + handwriting ──────────────────── */
function PassportWriting({
  variant,
  ariaLabel,
  value,
  onChange,
  paths,
  onPathsChange,
  readOnly,
}: {
  variant: "input" | "textarea";
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  paths: CanvasPath[];
  onPathsChange: (p: CanvasPath[]) => void;
  readOnly?: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [showCanvas, setShowCanvas] = useState(paths.length > 0);
  const [erasing, setErasing] = useState(false);
  const loadedRef = useRef(false);
  const justLoadedRef = useRef(false);
  const canvasHeight = variant === "textarea" ? 120 : 84;

  // Auto-grow the textarea to fit its content.
  useEffect(() => {
    const el = taRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  // Load saved strokes once, the first time the canvas becomes visible.
  useEffect(() => {
    if (showCanvas && !loadedRef.current && canvasRef.current) {
      loadedRef.current = true;
      if (paths.length > 0) {
        justLoadedRef.current = true;
        void canvasRef.current.loadPaths(paths);
      }
    }
  }, [showCanvas, paths]);

  const handleCanvasChange = (updated: CanvasPath[]) => {
    if (readOnly) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    onPathsChange(updated);
  };

  const usePen = () => {
    setErasing(false);
    canvasRef.current?.eraseMode(false);
  };
  const useEraser = () => {
    setErasing(true);
    canvasRef.current?.eraseMode(true);
  };

  return (
    <div className="passport-write-block">
      {variant === "input" ? (
        <input
          className="passport-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          aria-label={ariaLabel}
          dir="rtl"
        />
      ) : (
        <textarea
          ref={taRef}
          className="passport-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          rows={2}
          aria-label={ariaLabel}
        />
      )}

      {!readOnly && !showCanvas && (
        <button
          type="button"
          className="passport-hand-btn"
          onClick={() => setShowCanvas(true)}
        >
          ✍ Write by Hand
        </button>
      )}

      {showCanvas && (
        <div className="passport-canvas-block">
          {!readOnly && (
            <div
              className="passport-toolbar"
              role="toolbar"
              aria-label={`${ariaLabel} tools`}
            >
              <button
                type="button"
                className={`passport-tool${!erasing ? " is-active" : ""}`}
                onClick={usePen}
                aria-label="Pen"
                title="Pen"
              >
                ✏
              </button>
              <button
                type="button"
                className={`passport-tool${erasing ? " is-active" : ""}`}
                onClick={useEraser}
                aria-label="Eraser"
                title="Eraser"
              >
                🧽
              </button>
              <button
                type="button"
                className="passport-tool"
                onClick={() => canvasRef.current?.undo()}
                aria-label="Undo"
                title="Undo"
              >
                ↶
              </button>
              <button
                type="button"
                className="passport-tool"
                onClick={() => canvasRef.current?.redo()}
                aria-label="Redo"
                title="Redo"
              >
                ↷
              </button>
              <button
                type="button"
                className="passport-tool"
                onClick={() => canvasRef.current?.clearCanvas()}
                aria-label="Clear"
                title="Clear"
              >
                🗑
              </button>
            </div>
          )}

          <ReactSketchCanvas
            ref={canvasRef}
            className="passport-canvas"
            width="100%"
            height={`${canvasHeight}px`}
            strokeWidth={2}
            eraserWidth={14}
            strokeColor="#2f220c"
            canvasColor="#ffffff"
            readOnly={readOnly}
            onChange={handleCanvasChange}
            style={{ border: "1px solid #d8c9a6", borderRadius: "8px" }}
            withTimestamp={false}
          />
        </div>
      )}
    </div>
  );
}

const PassportLeaf = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  ({ children }, ref) => (
    <div className="passport-leaf" ref={ref}>
      <div className="passport-leaf-inner">{children}</div>
    </div>
  ),
);
PassportLeaf.displayName = "PassportLeaf";

function PassportPageBody({
  page,
  pageIndex,
  total,
  onField,
  onDrawing,
  readOnly,
  onClose,
}: {
  page: LocalPage;
  pageIndex: number;
  total: number;
  onField: (field: FieldKey, value: string) => void;
  onDrawing: (field: FieldKey, paths: CanvasPath[]) => void;
  readOnly?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="passport-page-body">
      <div className="passport-page-head">
        <span className="passport-cross-mark">✝</span>
        <span className="passport-page-num">
          {pageIndex + 1} / {total}
        </span>
      </div>

      <div className="passport-field">
        <label className="passport-field-label">اسم المهمة</label>
        <PassportWriting
          variant="input"
          ariaLabel="اسم المهمة"
          value={page.missionName}
          onChange={(v) => onField("missionName", v)}
          paths={page.drawings.missionName ?? []}
          onPathsChange={(p) => onDrawing("missionName", p)}
          readOnly={readOnly}
        />
      </div>

      <div className="passport-rounds">
        <div className="passport-field">
          <label className="passport-field-label">الجولة 1</label>
          <PassportWriting
            variant="input"
            ariaLabel="الجولة 1"
            value={page.round1}
            onChange={(v) => onField("round1", v)}
            paths={page.drawings.round1 ?? []}
            onPathsChange={(p) => onDrawing("round1", p)}
            readOnly={readOnly}
          />
        </div>
        <div className="passport-field">
          <label className="passport-field-label">الجولة 2</label>
          <PassportWriting
            variant="input"
            ariaLabel="الجولة 2"
            value={page.round2}
            onChange={(v) => onField("round2", v)}
            paths={page.drawings.round2 ?? []}
            onPathsChange={(p) => onDrawing("round2", p)}
            readOnly={readOnly}
          />
        </div>
      </div>

      <PassportWriting
        variant="textarea"
        ariaLabel="تأمل"
        value={page.reflection}
        onChange={(v) => onField("reflection", v)}
        paths={page.drawings.reflection ?? []}
        onPathsChange={(p) => onDrawing("reflection", p)}
        readOnly={readOnly}
      />

      <div className="passport-section-divider">
        <span>الاقتلاع</span>
      </div>

      <PassportWriting
        variant="textarea"
        ariaLabel="الاقتلاع"
        value={page.uprooting}
        onChange={(v) => onField("uprooting", v)}
        paths={page.drawings.uprooting ?? []}
        onPathsChange={(p) => onDrawing("uprooting", p)}
        readOnly={readOnly}
      />

      {onClose && !readOnly && (
        <button className="passport-close-btn" onClick={onClose}>
          إغلاق الجواز
        </button>
      )}
    </div>
  );
}

export default function Passport({
  readOnly = false,
  participantId,
}: {
  readOnly?: boolean;
  participantId?: number;
}) {
  const isAdmin = readOnly && participantId != null;
  const queryClient = useQueryClient();

  const myQuery = useGetMyPassport({
    query: { enabled: !isAdmin, queryKey: getGetMyPassportQueryKey() },
  });
  const adminQuery = useGetParticipantPassport(participantId ?? 0, {
    query: {
      enabled: isAdmin,
      queryKey: getGetParticipantPassportQueryKey(participantId ?? 0),
    },
  });

  const data = isAdmin ? adminQuery.data : myQuery.data;
  const isLoading = isAdmin ? adminQuery.isLoading : myQuery.isLoading;

  const updateMutation = useUpdateMyPassport();
  const mutateRef = useRef(updateMutation.mutate);
  mutateRef.current = updateMutation.mutate;

  const [pages, setPages] = useState<LocalPage[] | null>(null);
  const pagesRef = useRef<LocalPage[] | null>(null);
  const initRef = useRef(false);
  const [isOpen, setIsOpen] = useState(readOnly);
  // Bumped whenever read-only content is re-hydrated, to remount the book so
  // the handwriting canvases reload the latest saved strokes.
  const [syncKey, setSyncKey] = useState(0);
  const lastUpdatedAtRef = useRef<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise local state from the server. In editable mode this runs once so
  // a background refetch never clobbers in-progress edits. In read-only (admin)
  // mode it re-hydrates whenever the server returns a newer version, so the
  // admin always sees the latest saved passport.
  useEffect(() => {
    if (!data) return;
    const serverUpdatedAt =
      (data as { updatedAt?: string }).updatedAt ?? null;

    if (readOnly) {
      if (lastUpdatedAtRef.current === serverUpdatedAt && initRef.current) {
        return;
      }
      lastUpdatedAtRef.current = serverUpdatedAt;
      initRef.current = true;
      const p = normalizePages(data.pages as PassportPage[] | undefined);
      pagesRef.current = p;
      setPages(p);
      setSyncKey((k) => k + 1);
      return;
    }

    if (!initRef.current) {
      initRef.current = true;
      lastUpdatedAtRef.current = serverUpdatedAt;
      const p = normalizePages(data.pages as PassportPage[] | undefined);
      pagesRef.current = p;
      setPages(p);
    }
  }, [data, readOnly]);

  const flushSave = () => {
    if (readOnly) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (pagesRef.current) {
      saveNow(pagesRef.current);
    }
  };

  // Persist the given pages and update the cached query so a remount within the
  // same session (participant leaving and returning) starts from fresh data.
  const saveNow = (next: LocalPage[]) => {
    mutateRef.current(
      { data: { pages: next } },
      {
        onSuccess: (saved) => {
          queryClient.setQueryData(getGetMyPassportQueryKey(), saved);
          lastUpdatedAtRef.current =
            (saved as { updatedAt?: string }).updatedAt ?? null;
        },
      },
    );
  };

  const scheduleSave = (next: LocalPage[]) => {
    if (readOnly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveNow(next);
    }, 700);
  };

  // Flush any pending save when the component unmounts.
  useEffect(() => {
    return () => {
      if (readOnly) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (pagesRef.current) {
          saveNow(pagesRef.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyChange = (fn: (pages: LocalPage[]) => LocalPage[]) => {
    const base = pagesRef.current;
    if (!base) return;
    const next = fn(base);
    pagesRef.current = next;
    setPages(next);
    scheduleSave(next);
  };

  const setField = (idx: number, field: FieldKey, value: string) =>
    applyChange((ps) =>
      ps.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );

  const setDrawing = (idx: number, field: FieldKey, paths: CanvasPath[]) =>
    applyChange((ps) =>
      ps.map((p, i) =>
        i === idx ? { ...p, drawings: { ...p.drawings, [field]: paths } } : p,
      ),
    );

  const handleClose = () => {
    flushSave();
    setIsOpen(false);
  };

  const book = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="passport-book-wrap"
    >
      <HTMLFlipBook
        key={readOnly ? syncKey : "edit"}
        width={PAGE_W}
        height={PAGE_H}
        size="stretch"
        minWidth={270}
        maxWidth={PAGE_W}
        minHeight={390}
        maxHeight={PAGE_H}
        maxShadowOpacity={0.5}
        showCover={false}
        mobileScrollSupport={true}
        className="passport-flipbook"
        style={{}}
        startPage={0}
        drawShadow={true}
        flippingTime={650}
        usePortrait={true}
        startZIndex={0}
        autoSize={false}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
      >
        {(pages ?? []).map((page, i) => (
          <PassportLeaf key={i}>
            <PassportPageBody
              page={page}
              pageIndex={i}
              total={pages?.length ?? 4}
              onField={(f, v) => setField(i, f, v)}
              onDrawing={(f, p) => setDrawing(i, f, p)}
              readOnly={readOnly}
              onClose={
                i === (pages?.length ?? 0) - 1 && !readOnly
                  ? handleClose
                  : undefined
              }
            />
          </PassportLeaf>
        ))}
      </HTMLFlipBook>

      <p className="passport-flip-hint">اسحب الصفحة للتقليب</p>
    </motion.div>
  );

  const cover = (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="passport-cover"
    >
      <div className="passport-cover-frame" />
      <div className="passport-cover-content">
        <h3 className="passport-cover-title">جواز العبور</h3>
        <div className="passport-cover-cross">✝</div>
        <p className="passport-cover-subtitle">الدخول إلى جبل صهيون</p>
        <button className="passport-open-btn" onClick={() => setIsOpen(true)}>
          Open Passport
        </button>
      </div>
    </motion.div>
  );

  const loadingView = (
    <div className="flex justify-center py-14">
      <Spinner className="w-6 h-6 text-primary" />
    </div>
  );

  const stage =
    isLoading || !pages ? loadingView : !isOpen ? cover : book;

  // In read-only (admin) mode, render just the book without the card chrome,
  // since it lives inside a dialog.
  if (readOnly) {
    return <div className="passport-readonly-stage">{stage}</div>;
  }

  return (
    <div className="passport-card">
      <div className="passport-card-strip" />

      <div className="passport-card-head">
        <div className="passport-card-icon">📖</div>
        <div>
          <h2 className="passport-card-title">جواز العبور</h2>
          <p className="passport-card-subtitle">Your journey passport</p>
        </div>
      </div>

      <div className="passport-stage">{stage}</div>
    </div>
  );
}
