import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import { ArrowLeft, CheckCircle } from "lucide-react";

const REQUEST_TYPES = [
  { value: "birth_cert", label: "Birth Certificate", icon: "📋" },
  { value: "land_permit", label: "Land Permit", icon: "🏡" },
  { value: "agri_inputs", label: "Agricultural Inputs", icon: "🌾" },
  { value: "infra_report", label: "Infrastructure Report", icon: "🚧" },
  { value: "other", label: "Other", icon: "📄" },
];

export default function CitizenSubmitRequestPage() {
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const submitRequest = useCitizenStore((s) => s.submitRequest);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType) {
      setError("Select a request type");
      return;
    }
    if (!description.trim()) {
      setError("Describe your request");
      return;
    }
    setLoading(true);
    setError("");
    const result = await submitRequest({ request_type: requestType, description: description.trim() });
    setLoading(false);
    if (result) {
      setSubmitted(true);
    } else {
      setError("Failed to submit. Try again.");
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-xl font-bold text-gray-900">Request Submitted!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your request has been sent to the Parish Chief for review. You can track it in "My Requests".
        </p>
        <button
          onClick={() => navigate("/citizen/requests")}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
        >
          View My Requests
        </button>
        <button
          onClick={() => { setSubmitted(false); setRequestType(""); setDescription(""); }}
          className="mt-2 text-xs text-gray-400 underline"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Submit Request</h1>
          <p className="text-xs text-gray-400">Choose a type and describe what you need</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Request Type</label>
          <div className="space-y-2">
            {REQUEST_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setRequestType(rt.value)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                  requestType === rt.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-xl">{rt.icon}</span>
                <span className="text-sm font-medium text-gray-900">{rt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what you need help with..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
