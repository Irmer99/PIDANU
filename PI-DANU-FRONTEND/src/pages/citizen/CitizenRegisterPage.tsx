import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import { Shield, ArrowLeft } from "lucide-react";

export default function CitizenRegisterPage() {
  const [form, setForm] = useState({
    nin: "",
    pin: "",
    confirmPin: "",
    full_name: "",
    phone_number: "",
    parish: "",
    district: "",
    language_preference: "en",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useCitizenStore((s) => s.register);
  const navigate = useNavigate();

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nin.trim() || !form.full_name.trim() || !form.parish.trim() || !form.district.trim()) {
      setError("Fill in all required fields");
      return;
    }
    if (form.pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (form.pin !== form.confirmPin) {
      setError("PINs do not match");
      return;
    }
    setLoading(true);
    setError("");
    const ok = await register({
      nin: form.nin.trim(),
      pin: form.pin,
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim() || undefined,
      parish: form.parish.trim(),
      district: form.district.trim(),
      language_preference: form.language_preference,
    });
    setLoading(false);
    if (ok) navigate("/citizen/home");
    else setError("Registration failed. Try again.");
  };

  const field =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-primary to-primary-light px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/citizen/login" className="mb-4 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Back to login
        </Link>

        <div className="mb-6 text-center">
          <Shield className="mx-auto mb-2 h-10 w-10 text-secondary" />
          <h1 className="text-xl font-bold text-white">Create Account</h1>
          <p className="text-xs text-white/60">Register with your National ID</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-5 shadow-xl">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">Full Name *</label>
            <input className={field} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Nakato Sarah" />
          </div>

          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">NIN *</label>
            <input className={field} value={form.nin} onChange={(e) => update("nin", e.target.value)} placeholder="CM800123456ABCD" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">PIN *</label>
              <input type="password" inputMode="numeric" maxLength={4} className={field} value={form.pin} onChange={(e) => update("pin", e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">Confirm PIN *</label>
              <input type="password" inputMode="numeric" maxLength={4} className={field} value={form.confirmPin} onChange={(e) => update("confirmPin", e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">Phone Number</label>
            <input className={field} value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} placeholder="+256700000000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">Parish *</label>
              <input className={field} value={form.parish} onChange={(e) => update("parish", e.target.value)} placeholder="Owino" />
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">District *</label>
              <input className={field} value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Kampala" />
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">Preferred Language</label>
            <select className={field} value={form.language_preference} onChange={(e) => update("language_preference", e.target.value)}>
              <option value="en">English</option>
              <option value="lg">Luganda</option>
              <option value="rn">Runyankole</option>
              <option value="te">Ateso</option>
              <option value="ach">Acholi</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
