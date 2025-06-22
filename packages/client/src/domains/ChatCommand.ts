export type ChatCommand =
  | {
      type: "increaseFontSize";
    }
  | {
      type: "decreaseFontSize";
    }
  | {
      type: "increaseLineSpacing";
    }
  | {
      type: "decreaseLineSpacing";
    }
  | {
      type: "increaseLetterSpacing";
    }
  | {
      type: "decreaseLetterSpacing";
    }
  | {
      type: "increaseFontWeight";
    }
  | {
      type: "decreaseFontWeight";
    }
  | {
      type: "setVerticalWriting";
    }
  | {
      type: "setHorizontalWriting";
    }
  | {
      type: "makeUp";
    }
  | {
      type: "makeDown";
    }
  | {
      type: "makeLeft";
    }
  | {
      type: "makeRight";
    }
  | {
      type: "content";
      content: string;
    };

export function parseChatCommand(transcript: string): ChatCommand | null {
  if (transcript.includes("と書いて")) {
    const content = transcript.replace(/と書いて.*$/, "").trim();
    if (content) {
      return { type: "content", content };
    }
  }

  if (transcript.includes("大きく")) {
    return { type: "increaseFontSize" };
  }

  if (transcript.includes("小さく")) {
    return { type: "decreaseFontSize" };
  }

  if (transcript.includes("行間を広く")) {
    return { type: "increaseLineSpacing" };
  }

  if (transcript.includes("行間を狭く")) {
    return { type: "decreaseLineSpacing" };
  }

  if (transcript.includes("文字の間を広く")) {
    return { type: "increaseLetterSpacing" };
  }

  if (transcript.includes("文字の間を狭く")) {
    return { type: "decreaseLetterSpacing" };
  }

  if (transcript.includes("太く")) {
    return { type: "increaseFontWeight" };
  }

  if (transcript.includes("細く")) {
    return { type: "decreaseFontWeight" };
  }

  if (transcript.includes("縦書き")) {
    return { type: "setVerticalWriting" };
  }

  if (transcript.includes("横書き")) {
    return { type: "setHorizontalWriting" };
  }

  if (transcript.includes("上")) {
    return { type: "makeUp" };
  }

  if (transcript.includes("下")) {
    return { type: "makeDown" };
  }

  if (transcript.includes("左")) {
    return { type: "makeLeft" };
  }

  if (transcript.includes("右")) {
    return { type: "makeRight" };
  }

  return null;
}

export const availableChatCommands: string[] = [
  "文字を大きく",
  "文字を小さく",
  "行間を広く",
  "行間を狭く",
  "文字の間を広く",
  "文字の間を狭く",
  "太く",
  "細く",
  "縦書き",
  "横書き",
  "上へ",
  "下へ",
  "左へ",
  "右へ",
  "～と書いて",
];
