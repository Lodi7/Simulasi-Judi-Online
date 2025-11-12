import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import AdminPassword from "./AdminPassword";
import SlotGame from "./SlotGame";
import AdminDashboard from "./AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/password" element={<AdminPassword />} />
        <Route path="/game" element={<SlotGame />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
