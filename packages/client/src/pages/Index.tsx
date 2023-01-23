import { Navigate } from "react-router-dom";

export default function Index(): JSX.Element {
  return (
    <div>
      <Navigate to="/generate"></Navigate>
    </div>
  );
}
