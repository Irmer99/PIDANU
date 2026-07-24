import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import { Shield } from "lucide-react";

export default function CitizenLoginPage() {
  const [nin, setNin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useCitizenStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nin.trim() || pin.length !== 4) {
      setError("Enter your NIN and 4-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    const ok = await login(nin.trim(), pin);
    setLoading(false);
    if (ok) {
      navigate("/citizen/home");
    } else {
      setError("Invalid NIN or PIN. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-light px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-secondary" />
          <h1 className="text-2xl font-bold text-white">PI-DANU Citizen</h1>
          <p className="mt-1 text-sm text-white/70">Sign in with your NIN and PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">National ID Number (NIN)</label>
            <input
              type="text"
              value={nin}
              onChange={(e) => setNin(e.target.value)}
              placeholder="e.g. CM800123456ABCD"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Demo: NIN <span className="font-mono">CM800123456ABCD</span> / PIN <span className="font-mono">1234</span>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          New here?{" "}
          <Link to="/citizen/register" className="font-semibold text-white underline">
            Register
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/demo/ussd" className="text-xs text-white/40 underline hover:text-white/60">
            Try USSD Demo instead
          </Link>
        </div>
      </div>
    </div>
  );
}
