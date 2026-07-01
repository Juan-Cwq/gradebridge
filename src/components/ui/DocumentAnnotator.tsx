"use client";

import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  MessageSquarePlus,
  Highlighter,
  MousePointer2,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  FileWarning,
} from "lucide-react";

// pdf.js worker is loaded from a CDN matching the bundled pdfjs-dist version.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type Annotation = {
  id: string;
  page: number;
  // All coordinates are fractions (0..1) of the rendered page, so they stay
  // correct regardless of zoom or screen size.
  x: number;
  y: number;
  width: number;
  height: number;
  type: "comment" | "highlight";
  color: string;
  body: string | null;
};

type Tool = "cursor" | "comment" | "highlight";

type DraftHighlight = {
  page: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  fileUrl: string;
  fileType?: string | null;
  fileName?: string | null;
  annotations: Annotation[];
  editable?: boolean;
  onCreate?: (a: Omit<Annotation, "id">) => Promise<Annotation | null> | void;
  onUpdate?: (id: string, patch: Partial<Annotation>) => void;
  onDelete?: (id: string) => void;
};

const HIGHLIGHT_COLOR = "#facc15";
const COMMENT_COLOR = "#ec4899";
const BASE_WIDTH = 700;

function detectKind(fileType?: string | null, fileName?: string | null) {
  const t = (fileType || "").toLowerCase();
  const n = (fileName || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf" as const;
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n))
    return "image" as const;
  return "other" as const;
}

export default function DocumentAnnotator({
  fileUrl,
  fileType,
  fileName,
  annotations,
  editable = false,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const kind = detectKind(fileType, fileName);
  const [numPages, setNumPages] = useState(kind === "image" ? 1 : 0);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState<Tool>("cursor");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<DraftHighlight | null>(null);

  const pageWidth = Math.round(BASE_WIDTH * scale);

  const fracFromEvent = (
    e: React.MouseEvent,
    el: HTMLElement
  ): { x: number; y: number } => {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const createAnnotation = useCallback(
    async (a: Omit<Annotation, "id">) => {
      if (!onCreate) return;
      const created = await onCreate(a);
      if (created) setSelectedId(created.id);
    },
    [onCreate]
  );

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!editable || tool !== "comment") return;
    const { x, y } = fracFromEvent(e, e.currentTarget);
    createAnnotation({
      page,
      x,
      y,
      width: 0,
      height: 0,
      type: "comment",
      color: COMMENT_COLOR,
      body: "",
    });
    setTool("cursor");
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!editable || tool !== "highlight") return;
    const { x, y } = fracFromEvent(e, e.currentTarget);
    setDraft({ page, startX: x, startY: y, x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draft) return;
    const { x, y } = fracFromEvent(e, e.currentTarget);
    setDraft({
      ...draft,
      x: Math.min(draft.startX, x),
      y: Math.min(draft.startY, y),
      width: Math.abs(x - draft.startX),
      height: Math.abs(y - draft.startY),
    });
  };

  const handleMouseUp = () => {
    if (!draft) return;
    const d = draft;
    setDraft(null);
    if (d.width < 0.01 || d.height < 0.01) return;
    createAnnotation({
      page: d.page,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
      type: "highlight",
      color: HIGHLIGHT_COLOR,
      body: "",
    });
    setTool("cursor");
  };

  const commentNumberFor = (id: string) => {
    const comments = annotations
      .filter((a) => a.type === "comment")
      .sort((a, b) => a.page - b.page || a.y - b.y);
    return comments.findIndex((a) => a.id === id) + 1;
  };

  const renderOverlay = (page: number) => {
    const pageAnnotations = annotations.filter((a) => a.page === page);
    return (
      <div className="pointer-events-none absolute inset-0">
        {pageAnnotations.map((a) => {
          const isSelected = a.id === selectedId;
          if (a.type === "highlight") {
            return (
              <div
                key={a.id}
                className="absolute rounded-sm pointer-events-auto cursor-pointer transition-shadow"
                style={{
                  left: `${a.x * 100}%`,
                  top: `${a.y * 100}%`,
                  width: `${a.width * 100}%`,
                  height: `${a.height * 100}%`,
                  backgroundColor: `${a.color}55`,
                  border: `1.5px solid ${a.color}`,
                  boxShadow: isSelected ? `0 0 0 2px ${COMMENT_COLOR}` : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(a.id);
                }}
              />
            );
          }
          return (
            <button
              key={a.id}
              type="button"
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-full flex items-center justify-center w-7 h-7 rounded-full rounded-bl-none text-white text-xs font-bold shadow-lg ring-2 ring-white transition-transform hover:scale-110"
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                backgroundColor: a.color,
                transform: isSelected ? "translate(-50%, -100%) scale(1.15)" : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(a.id);
              }}
            >
              {commentNumberFor(a.id)}
            </button>
          );
        })}

        {/* live highlight being drawn */}
        {draft && draft.page === page && (
          <div
            className="absolute rounded-sm"
            style={{
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.width * 100}%`,
              height: `${draft.height * 100}%`,
              backgroundColor: `${HIGHLIGHT_COLOR}55`,
              border: `1.5px dashed ${HIGHLIGHT_COLOR}`,
            }}
          />
        )}
      </div>
    );
  };

  const pageCursor =
    editable && tool === "comment"
      ? "cursor-copy"
      : editable && tool === "highlight"
      ? "cursor-crosshair"
      : "cursor-default";

  const pageWrapperProps = (page: number) => ({
    className: `relative mx-auto shadow-md bg-white ${pageCursor}`,
    style: { width: pageWidth, maxWidth: "100%" },
    onClick: (e: React.MouseEvent<HTMLDivElement>) => handlePageClick(e, page),
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => handleMouseDown(e, page),
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: () => draft && handleMouseUp(),
  });

  const selected = annotations.find((a) => a.id === selectedId) || null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300 bg-base-200/60 flex-wrap">
        {editable && (
          <div className="flex rounded-lg border border-base-300 overflow-hidden bg-base-100">
            <ToolButton
              active={tool === "cursor"}
              onClick={() => setTool("cursor")}
              title="Select / move"
            >
              <MousePointer2 className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              active={tool === "comment"}
              onClick={() => setTool("comment")}
              title="Add a comment pin"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              active={tool === "highlight"}
              onClick={() => setTool("highlight")}
              title="Draw a highlight"
            >
              <Highlighter className="w-4 h-4" />
            </ToolButton>
          </div>
        )}

        {editable && (
          <span className="text-xs text-base-content/60 hidden sm:inline">
            {tool === "comment"
              ? "Click anywhere on the document to drop a comment"
              : tool === "highlight"
              ? "Click and drag to highlight a region"
              : "Pick a tool to annotate"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
            className="p-1.5 rounded hover:bg-base-300"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
            className="p-1.5 rounded hover:bg-base-300"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            download={fileName || true}
            className="p-1.5 rounded hover:bg-base-300"
            title="Download original"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Document surface */}
      <div className="flex-1 overflow-auto bg-base-300/40 p-4">
        {kind === "other" || loadError ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-3">
            <FileWarning className="w-10 h-10 text-base-content/40" />
            <p className="text-sm text-base-content/70 max-w-xs">
              {loadError
                ? "This file couldn't be previewed inline."
                : "This file type can't be previewed inline (annotations work for PDFs and images)."}
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download {fileName || "file"}
            </a>
          </div>
        ) : kind === "image" ? (
          <div {...pageWrapperProps(1)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={fileName || "submission"}
              className="w-full h-auto select-none pointer-events-none block"
              draggable={false}
              onError={() => setLoadError(true)}
            />
            {renderOverlay(1)}
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex items-center justify-center h-40 gap-2 text-base-content/60">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading document…
              </div>
            }
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <div key={page} {...pageWrapperProps(page)}>
                <Page
                  pageNumber={page}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                {renderOverlay(page)}
              </div>
            ))}
          </Document>
        )}
      </div>

      {/* Selected annotation editor / viewer */}
      {selected && (
        <AnnotationEditor
          key={selected.id}
          annotation={selected}
          number={selected.type === "comment" ? commentNumberFor(selected.id) : null}
          editable={editable}
          onClose={() => setSelectedId(null)}
          onSave={(body) => onUpdate?.(selected.id, { body })}
          onDelete={() => {
            onDelete?.(selected.id);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 transition-colors ${
        active ? "bg-primary text-primary-content" : "hover:bg-base-200"
      }`}
    >
      {children}
    </button>
  );
}

function AnnotationEditor({
  annotation,
  number,
  editable,
  onClose,
  onSave,
  onDelete,
}: {
  annotation: Annotation;
  number: number | null;
  editable: boolean;
  onClose: () => void;
  onSave: (body: string) => void;
  onDelete: () => void;
}) {
  const [body, setBody] = useState(annotation.body || "");

  return (
    <div className="border-t border-base-300 bg-base-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[11px] font-bold"
            style={{ backgroundColor: annotation.color }}
          >
            {annotation.type === "comment" ? number : "H"}
          </span>
          {annotation.type === "comment" ? "Comment" : "Highlight note"}
        </span>
        <div className="flex items-center gap-1">
          {editable && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-error/10 text-error"
              title="Delete annotation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-base-200"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {editable ? (
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => onSave(body)}
          placeholder="Write your feedback…"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-base-300 bg-base-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <p className="text-sm text-base-content/80 whitespace-pre-wrap">
          {annotation.body || <span className="italic text-base-content/40">No note</span>}
        </p>
      )}
    </div>
  );
}
