import React, { FC } from "react";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";

/**
 * --- Utility types ----------------------------------------------------------
 * If your project already re-exports these from Lexical you can remove them.
 */
type Match = {
  index: number;
  length: number;
  text: string;
  url: string;
};

type Matcher = (text: string) => Match | null;

/**
 * --- RegExp helpers ---------------------------------------------------------
 */
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

/**
 * --- Auto-link matchers -----------------------------------------------------
 * Each matcher should return either a `Match` object or `null`.
 */
const MATCHERS: Matcher[] = [
  (text) => {
    const match = URL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: match[0],
      }
    );
  },
  (text) => {
    const match = EMAIL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: `mailto:${match[0]}`, // prepend mailto:
      }
    );
  },
];

/**
 * --- Component --------------------------------------------------------------
 */
const PlaygroundAutoLinkPlugin: FC = () => {
  return <AutoLinkPlugin matchers={MATCHERS} />;
};

export default PlaygroundAutoLinkPlugin;
