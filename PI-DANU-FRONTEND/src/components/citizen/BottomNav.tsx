import { NavLink } from "react-router-dom";
import { Home, ClipboardPlus, ClipboardList, User } from "lucide-react";

const navItems = [
  { to: "/citizen/home", label: "Home", icon: Home },
  { to: "/citizen/submit", label: "Submit", icon: ClipboardPlus },
  { to: "/citizen/requests", label: "My Requests", icon: ClipboardList },
  { to: "/citizen/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-gray-400"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
