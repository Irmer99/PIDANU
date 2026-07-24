import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function CitizenLoginPage() {
  const [nin, setNin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/citizen/login", { nin, pin });
      localStorage.setItem("citizen_token", data.token);
      localStorage.setItem("citizen_user", JSON.stringify(data.user));
      navigate("/citizen/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Check your NIN and PIN.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-2xl font-bold text-green-700">PI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">PI-DANU</h1>
          <p className="text-green-200 mt-2">Parish Development Model Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Citizen Login</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number (NIN)</label>
            <input
              type="text"
              value={nin}
              onChange={(e) => setNin(e.target.value)}
              placeholder="e.g. CM850123456ABCD"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg tracking-wider font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              maxLength={4}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-2xl text-center tracking-[0.5em] font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Register via USSD: dial <span className="font-mono font-bold">*384*14332#</span>
          </p>
        </form>
      </div>
    </div>
  );
}
