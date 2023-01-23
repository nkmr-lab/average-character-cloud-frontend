import * as H from "history";
import { useLocation } from "react-router";
import { LocationState } from "../types/LocationState";

export function useBackground(): H.Location {
  const location = useLocation();
  const state = location.state as LocationState;

  return state?.background ?? location;
}
