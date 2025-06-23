export interface GenerateTemplate {
  id: string;
  backgroundImage: {
    url: string;
    mimeType: string;
    size: number;
  };
  fontColor: number;
  writingMode: "horizontal" | "vertical";
  marginBlockStart: number;
  marginInlineStart: number;
  lineSpacing: number;
  letterSpacing: number;
  fontSize: number;
  fontWeight: number;
}
