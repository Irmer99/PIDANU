import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import toast from "react-hot-toast";
import { Shield, Delete } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) setPin((prev) => prev + digit);
  };

  const handleClear = () => setPin("");

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    const success = await login(pin);
    setLoading(false);
    if (success) {
      toast.success("Welcome to PI-DANU");
      navigate("/dashboard");
    } else {
      toast.error("Invalid PIN. Try 1234 for demo.");
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Shield className="h-8 w-8 text-primary-dark" />
          </div>
          <h1 className="text-2xl font-bold text-white">PI-DANU</h1>
          <p className="mt-1 text-sm text-white/70">Public Service Delivery System</p>
        </div>

        {/* PIN Pad */}
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <p className="mb-4 text-center text-sm font-medium text-gray-600">Enter your PIN</p>

          {/* PIN display */}
          <div className="mb-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-12 w-12 rounded-xl border-2 text-center leading-10 text-lg font-bold transition-all ${
                  pin.length > i
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-gray-50 text-gray-300"
                }`}
              >
                {pin.length > i ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="h-14 rounded-xl text-lg font-semibold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 rounded-xl text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit("0")}
              className="h-14 rounded-xl text-lg font-semibold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="flex h-14 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || loading}
            className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">Demo PIN: 1234</p>
        </div>
      </div>
    </div>
  );
}
