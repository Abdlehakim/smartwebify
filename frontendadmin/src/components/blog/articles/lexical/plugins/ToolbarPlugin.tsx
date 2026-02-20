/* ───────── ToolbarPlugin.tsx ─────────
   Google‐style Lexical toolbar with link‐editing support
   Updated 2025-06-05 (always show Remove alongside Add/Edit,
   auto-prefix phone numbers with tel:, accept manual “tel:”; truncate long link display)
────────────────────────────────────── */

import React, {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  RangeSelection,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";

/* ───────── helpers ───────── */

function getSelectedNode(selection: RangeSelection): LexicalNode {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  return anchorNode === focusNode
    ? anchorNode
    : selection.isBackward()
    ? focusNode
    : anchorNode;
}

function positionEditorElement(elem: HTMLElement, rect: DOMRect | null): void {
  if (rect === null) {
    // Hide & move off-screen
    elem.style.opacity = "0";
    elem.style.pointerEvents = "none";
    elem.style.top = "-9999px";
    elem.style.left = "-9999px";
    return;
  }
  // Show & position above the selection
  elem.style.opacity = "1";
  elem.style.pointerEvents = "auto";
  const { scrollTop, scrollLeft } = document.documentElement;
  elem.style.top = `${rect.bottom + scrollTop + 8}px`;
  elem.style.left = `${rect.left + scrollLeft}px`;
}

/* ───────── floating link editor ───────── */

interface FloatingLinkEditorProps {
  editor: LexicalEditor;
}

const FloatingLinkEditor: FC<FloatingLinkEditorProps> = ({ editor }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mouseDownRef = useRef(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<RangeSelection | null>(
    null
  );

  // Maximum number of characters to display before truncation
  const MAX_DISPLAY_LENGTH = 20;

  /**
   * formatPreviewUrl:
   * - If input starts with "tel:", return as-is.
   * - If input starts with "http://" or "https://", return as-is.
   * - If input is only digits or "+" + digits, return "tel:<digits>".
   * - Otherwise, return "https://<input>".
   */
  const formatPreviewUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") return trimmed;

    // 1) Already a tel: link?
    if (trimmed.toLowerCase().startsWith("tel:")) {
      return trimmed;
    }

    // 2) Already an HTTP/HTTPS link?
    if (
      trimmed.toLowerCase().startsWith("http://") ||
      trimmed.toLowerCase().startsWith("https://")
    ) {
      return trimmed;
    }

    // 3) Only digits or "+" + digits => phone link
    const phonePattern = /^\+?\d+$/;
    if (phonePattern.test(trimmed)) {
      return `tel:${trimmed}`;
    }

    // 4) Otherwise assume HTTPS
    return `https://${trimmed}`;
  };

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) setLinkUrl(parent.getURL());
      else if ($isLinkNode(node)) setLinkUrl(node.getURL());
      else setLinkUrl("");
    }

    const editorElem = editorRef.current;
    const nativeSel = window.getSelection();
    if (!editorElem || !nativeSel) return;

    const rootEl = editor.getRootElement();
    if (
      selection &&
      !nativeSel.isCollapsed &&
      rootEl?.contains(nativeSel.anchorNode)
    ) {
      const rect = nativeSel.getRangeAt(0).getBoundingClientRect();
      if (!mouseDownRef.current) positionEditorElement(editorElem, rect);
      setLastSelection($isRangeSelection(selection) ? selection : null);
    } else {
      // Hide / move off-screen
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updateLinkEditor);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        1
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  // Is there a non-empty link currently present?
  const hasLink = linkUrl.trim().length > 0;

  // Compute truncated display text if link is too long
  const displayText =
    linkUrl.length > MAX_DISPLAY_LENGTH
      ? linkUrl.slice(0, MAX_DISPLAY_LENGTH) + "..."
      : linkUrl;

  return (
    <div
      ref={editorRef}
      style={{ top: "-9999px", left: "-9999px" }} // start off-screen
      className="absolute z-50 opacity-0 pointer-events-none"
      onMouseDown={() => (mouseDownRef.current = true)}
      onMouseUp={() => (mouseDownRef.current = false)}
    >
      {isEditMode ? (
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 space-x-2 w-fit">
          {/* URL / phone input */}
          <input
            ref={inputRef}
            type="url"
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={linkUrl}
            placeholder="https://example.com or phone digits"
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!lastSelection) return;

                const raw = linkUrl.trim();
                let payload = raw;

                // If user already typed "tel:…", honor it:
                if (!raw.toLowerCase().startsWith("tel:")) {
                  const phonePattern = /^\+?\d+$/;
                  // If only digits, prefix tel:
                  if (phonePattern.test(raw)) {
                    payload = `tel:${raw}`;
                  }
                  // If not http(s) or tel:, prefix https:
                  else if (
                    !raw.toLowerCase().startsWith("http://") &&
                    !raw.toLowerCase().startsWith("https://")
                  ) {
                    payload = `https://${raw}`;
                  }
                }

                editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload);
                setEditMode(false);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditMode(false);
              }
            }}
          />

          {/* Confirm button */}
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => {
              if (!lastSelection) return;

              const raw = linkUrl.trim();
              let payload = raw;

              // If user already typed "tel:…", honor it:
              if (!raw.toLowerCase().startsWith("tel:")) {
                const phonePattern = /^\+?\d+$/;
                // If only digits, prefix tel:
                if (phonePattern.test(raw)) {
                  payload = `tel:${raw}`;
                }
                // If not http(s) or tel:, prefix https:
                else if (
                  !raw.toLowerCase().startsWith("http://") &&
                  !raw.toLowerCase().startsWith("https://")
                ) {
                  payload = `https://${raw}`;
                }
              }

              editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload);
              setEditMode(false);
            }}
          >
            Confirm
          </button>

          {/* Cancel button */}
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={() => {
              setEditMode(false);
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-fit px-2">
          <a
            href={formatPreviewUrl(linkUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {displayText}
          </a>

          {/* Add/Edit button */}
          <button
            type="button"
            className="px-3 py-1 ml-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setEditMode(true);
            }}
          >
            {hasLink ? "Edit" : "Add"}
          </button>

          {/* Remove button (always visible) */}
          <button
            type="button"
            className="px-3 py-1 ml-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={() => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
              setLinkUrl("");
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

/* ───────── divider ───────── */

const Divider: FC = () => (
  <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
);

/* ───────── main toolbar plugin ───────── */

const LowPriority = 1;

const ToolbarPlugin: FC = () => {
  const [editor] = useLexicalComposerContext();

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updateToolbarState = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsLink($isLinkNode(node) || $isLinkNode(parent));
    }
  }, []);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(updateToolbarState);
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateToolbarState();
            return false;
          },
          LowPriority
        ),
        editor.registerCommand(
          CAN_UNDO_COMMAND,
          (payload: boolean) => {
            setCanUndo(payload);
            return false;
          },
          LowPriority
        ),
        editor.registerCommand(
          CAN_REDO_COMMAND,
          (payload: boolean) => {
            setCanRedo(payload);
            return false;
          },
          LowPriority
        )
      ),
    [editor, updateToolbarState]
  );

  const insertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "");
    }
  }, [editor, isLink]);

  return (
    <>
      <div className="toolbar flex items-center gap-1 bg-white p-2 shadow">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="toolbar-item p-1"
          aria-label="Undo"
        >
          <i className="format undo" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="toolbar-item p-1"
          aria-label="Redo"
        >
          <i className="format redo" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          className={`toolbar-item p-1 ${isBold ? "active" : ""}`}
          aria-label="Bold"
        >
          <i className="format bold" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
          }
          className={`toolbar-item p-1 ${isItalic ? "active" : ""}`}
          aria-label="Italic"
        >
          <i className="format italic" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
          className={`toolbar-item p-1 ${isUnderline ? "active" : ""}`}
          aria-label="Underline"
        >
          <i className="format underline" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
          className={`toolbar-item p-1 ${isStrikethrough ? "active" : ""}`}
          aria-label="Strikethrough"
        >
          <i className="format strikethrough" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={insertLink}
          className={`toolbar-item p-1 ${isLink ? "active" : ""}`}
          aria-label="Insert Link"
        >
          <i className="format link" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
          className="toolbar-item p-1"
          aria-label="Align left"
        >
          <i className="format left-align" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
          }
          className="toolbar-item p-1"
          aria-label="Align center"
        >
          <i className="format center-align" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
          }
          className="toolbar-item p-1"
          aria-label="Align right"
        >
          <i className="format right-align" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
          }
          className="toolbar-item p-1"
          aria-label="Justify"
        >
          <i className="format justify-align" />
        </button>
      </div>

      {isLink &&
        createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
    </>
  );
};

export default ToolbarPlugin;
