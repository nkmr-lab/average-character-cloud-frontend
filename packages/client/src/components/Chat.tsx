import * as icons from "@mui/icons-material";
import { Alert, IconButton } from "@mui/material";
import React from "react";
import {
  ChatCommand,
  parseChatCommand,
  availableChatCommands,
} from "../domains/ChatCommand";

export type Props = {
  onCommand?: (command: ChatCommand) => void;
};

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const isChatSupported = Boolean(SpeechRecognition);

export default function Chat({ onCommand }: Props): JSX.Element {
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const [recognizing, setRecognizing] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [commandParseError, setCommandParseError] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "ja-JP";

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          transcript += result[0].transcript;
          if (result.isFinal) {
            const command = parseChatCommand(transcript);
            if (!command) {
              setCommandParseError(
                "コマンドの解析に失敗しました。もう一度試してください。"
              );
            } else {
              onCommand?.(command);
            }
          }
        }
        setTranscript(transcript);
      };
      recognitionRef.current.onstart = () => {
        setRecognizing(true);
        setTranscript("");
        setError(null);
        setCommandParseError(null);
      };
      recognitionRef.current.onend = () => {
        setRecognizing(false);
      };
      recognitionRef.current.onerror = (event) => {
        setRecognizing(false);
        if (event.error === "no-speech") {
          setError("音声が認識されませんでした。もう一度試してください。");
        } else if (event.error === "audio-capture") {
          setError("マイクが見つかりません。マイクを接続してください。");
        } else if (event.error === "not-allowed") {
          setError("音声認識が許可されていません。設定を確認してください。");
        } else {
          setError(`エラーが発生しました: ${event.error}`);
        }
      };
    }
  }, []);

  return (
    <div>
      <div>利用可能なコマンド: {availableChatCommands.join(", ")}</div>
      <IconButton
        onClick={() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }}
      >
        <icons.Mic></icons.Mic>
      </IconButton>
      {recognizing ? (
        <div>認識中...</div>
      ) : (
        <div>音声認識を開始するにはマイクボタンをクリックしてください</div>
      )}
      <div>発話: {transcript}</div>
      {error && <Alert severity="error">{error}</Alert>}
      {commandParseError && <Alert severity="error">{commandParseError}</Alert>}
    </div>
  );
}
