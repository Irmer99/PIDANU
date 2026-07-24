import { NavLink } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  Shield,
  PhoneCall,
  Mic,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requests", label: "Requests", icon: ClipboardList },
  { to: "/citizens", label: "Citizens", icon: Users },
  { to: "/resources", label: "Resources", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { divider: true, label: "Voice & Demos" },
  { to: "/admin/voice-logs", label: "Voice Call Logs", icon: PhoneCall },
  { to: "/admin/voice-simulator", label: "Voice Simulator", icon: Mic },
  { divider: true, label: "System" },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-primary text-white transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-secondary" />
            <span className="text-lg font-bold tracking-tight">PI-DANU</span>
          </div>
        )}
        {!sidebarOpen && <Shield className="mx-auto h-7 w-7 text-secondary" />}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-1.5 hover:bg-white/10 lg:block"
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item, i) =>
          "divider" in item ? (
            sidebarOpen ? (
              <p key={`div-${i}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {item.label}
              </p>
            ) : (
              <hr key={`div-${i}`} className="my-3 border-white/10" />
            )
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${!sidebarOpen ? "justify-center" : ""}`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        {sidebarOpen ? (
          <p className="text-xs text-white/50">Ministry of Local Government</p>
        ) : (
          <p className="text-center text-[10px] text-white/50">MoLG</p>
        )}
      </div>
    </aside>
  );
}
