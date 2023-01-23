import * as H from "history";

export type LocationState =
  | Partial<{
      background: H.Location;
    }>
  | undefined;
