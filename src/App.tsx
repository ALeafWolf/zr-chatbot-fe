import PasswordGate from "./components/PasswordGate";
import AppRoutes from "./routes";

export default function App() {
  return (
    <PasswordGate>
      <AppRoutes />
    </PasswordGate>
  );
}
