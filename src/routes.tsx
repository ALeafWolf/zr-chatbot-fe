import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import ChatView from "./components/ChatView";
import EmptyState from "./components/EmptyState";

function ChatRoute() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <ChatView sessionId={id} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EmptyState />} />
        <Route path="sessions/:id" element={<ChatRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
