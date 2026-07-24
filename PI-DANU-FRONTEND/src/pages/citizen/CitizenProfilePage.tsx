import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import { ArrowLeft, LogOut, Shield, MapPin, Phone, Globe } from "lucide-react";

export default function CitizenProfilePage() {
  const { citizen, profile, loadProfile, logout } = useCitizenStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) loadProfile();
  }, [profile, loadProfile]);

  const handleLogout = () => {
    logout();
    navigate("/citizen/login");
  };

  return (
    <div className="space-y-6 px-4 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
          {(citizen?.name || "C").charAt(0)}
        </div>
        <h2 className="mt-3 text-lg font-bold text-gray-900">{citizen?.name || "Citizen"}</h2>
        <p className="text-xs text-gray-400">{citizen?.parish}, {citizen?.district}</p>
      </div>

      {/* Info Cards */}
      <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <ProfileRow icon={Shield} label="NIN" value={citizen?.nin || "-"} />
        <ProfileRow icon={Phone} label="Phone" value={profile?.phone_number || "Not set"} />
        <ProfileRow icon={MapPin} label="Parish" value={citizen?.parish || "-"} />
        <ProfileRow icon={MapPin} label="District" value={citizen?.district || "-"} />
        <ProfileRow icon={Globe} label="Language" value={profile?.language_preference?.toUpperCase() || "EN"} />
        <ProfileRow icon={Shield} label="Biometric" value={profile?.biometric_enabled ? "Enabled" : "Disabled"} />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      <p className="text-center text-[10px] text-gray-300">PI-DANU v1.0 — Ministry of Local Government</p>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <Icon className="h-4 w-4 text-gray-400" />
      <div className="flex-1">
        <p className="text-[10px] font-medium text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}
