import { Outlet, Navigate } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import BottomNav from "./BottomNav";

export default function CitizenLayout() {
  const isAuthenticated = useCitizenStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/citizen/login" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
