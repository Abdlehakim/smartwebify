// src/components/blog/articles/lexical/Editor.tsx
/* ───────── Editor.tsx ─────────
   Rich-text editor with Toolbar, Auto-link,
   clean HTML export/import, and one-time initial HTML import
   Updated 2025-06-11
──────────────────────────────── */

import React, { useCallback, useEffect, useRef } from "react";
import {
  LexicalComposer,
  InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import PlaygroundAutoLinkPlugin from "./plugins/AutoLinkPlugin";

import {
  ParagraphNode,
  TextNode,
  EditorState,
  $getRoot,
  isHTMLElement,
  DOMConversionMap,
  DOMExportOutput,
  DOMExportOutputMap,
  Klass,
  LexicalEditor,
  LexicalNode,
  $isTextNode,
} from "lexical";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";

import ExampleTheme from "./ExampleTheme";
import { parseAllowedColor, parseAllowedFontSize } from "./styleConfig";

const PLACEHOLDER = "Enter some rich text…";

/* ───────── clean export helpers ───────── */
function removeStylesExportDOM(
  editor: LexicalEditor,
  target: LexicalNode
): DOMExportOutput {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class],[dir="ltr"]'),
    ]) {
      el.removeAttribute("class");
      el.removeAttribute("style");
      if (el.getAttribute("dir") === "ltr") el.removeAttribute("dir");
    }
  }
  return output;
}

export const exportMap: DOMExportOutputMap = new Map<
  Klass<LexicalNode>,
  (editor: LexicalEditor, node: LexicalNode) => DOMExportOutput
>([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

/* ───────── import helpers ───────── */
function getExtraStyles(el: HTMLElement): string {
  let extra = "";
  const fs = parseAllowedFontSize(el.style.fontSize);
  const bg = parseAllowedColor(el.style.backgroundColor);
  const fg = parseAllowedColor(el.style.color);
  if (fs && fs !== "15px") extra += `font-size:${fs};`;
  if (bg && bg !== "rgb(255, 255, 255)") extra += `background-color:${bg};`;
  if (fg && fg !== "rgb(0, 0, 0)") extra += `color:${fg};`;
  return extra;
}

function constructImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};
  const domMap = TextNode.importDOM();
  if (!domMap) return importMap;

  for (const [tag, factory] of Object.entries(domMap)) {
    importMap[tag] = (node) => {
      const importer = factory(node);
      if (!importer) return null;
      const conversion = importer.conversion!;
      return {
        ...importer,
        conversion: (element: HTMLElement) => {
          const res = conversion(element);
          if (
            res === null ||
            typeof res.forChild !== "function" ||
            res.after !== undefined ||
            res.node !== null
          ) {
            return res;
          }
          const extra = getExtraStyles(element);
          if (!extra) return res;
          const originalForChild = res.forChild!;
          return {
            ...res,
            forChild: (child, parent) => {
              const tn = originalForChild(child, parent);
              if ($isTextNode(tn)) tn.setStyle(tn.getStyle() + extra);
              return tn;
            },
          };
        },
      };
    };
  }
  return importMap;
}

/* ───────── editor config ───────── */
const editorConfig: InitialConfigType = {
  namespace: "ArticleEditor",
  theme: ExampleTheme,
  nodes: [ParagraphNode, TextNode, LinkNode, AutoLinkNode],
  html: {
    export: exportMap,
    import: constructImportMap(),
  },
  onError(error) {
    throw error;
  },
};

/* ───────── initial-import plugin ───────── */
function InitialContentImportPlugin({ html }: { html?: string }) {
  const [editor] = useLexicalComposerContext();
  const hasImported = useRef(false);

  useEffect(() => {
    if (!hasImported.current && html) {
      hasImported.current = true;
      editor.update(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const nodes = $generateNodesFromDOM(editor, doc);
        const root = $getRoot();
        root.clear();
        nodes.forEach((n) => root.append(n));
      });
    }
  }, [editor, html]);

  return null;
}

/* ───────── component ───────── */
interface RichEditorProps {
  /** Called with the current HTML string on every edit */
  onChange: (html: string) => void;
  /** Minimum height for the editable area (px) */
  minHeight?: number;
  /** Initial HTML to import once */
  value?: string;
}

export function RichEditor({
  onChange,
  minHeight = 140,
  value = "",
}: RichEditorProps) {
  const emitHtml = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      const html = editorState.read(() => $generateHtmlFromNodes(editor));
      onChange(html);
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={editorConfig}>
      {/* import your DB HTML exactly once */}
      <InitialContentImportPlugin html={value} />

      <div className="editor-container rounded border border-gray-300 bg-white">
        <ToolbarPlugin />

        <div className="editor-inner relative" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input px-2 py-1 outline-none" />
            }
            placeholder={
              <div className="editor-placeholder px-2 py-1 text-gray-400">
                {PLACEHOLDER}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <HistoryPlugin />
          <LinkPlugin />
          <AutoFocusPlugin />
          <PlaygroundAutoLinkPlugin />
          <OnChangePlugin onChange={emitHtml} />
        </div>
      </div>
    </LexicalComposer>
  );
}
