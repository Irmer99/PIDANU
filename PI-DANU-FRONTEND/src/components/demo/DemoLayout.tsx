import { Outlet, Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function DemoLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm font-bold text-primary">PI-DANU</span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/demo/ussd" className="text-gray-500 hover:text-primary">USSD Demo</Link>
            <Link to="/demo/voice" className="text-gray-500 hover:text-primary">Voice Demo</Link>
            <Link to="/citizen/login" className="text-gray-500 hover:text-primary">Citizen App</Link>
            <Link to="/login" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-light">Admin</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
