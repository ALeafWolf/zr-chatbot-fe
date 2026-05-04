import AppRoutes from "./routes";
import { useThemeSync } from "./stores/themeStore";

export default function App() {
  useThemeSync();
  return <AppRoutes />;
}
