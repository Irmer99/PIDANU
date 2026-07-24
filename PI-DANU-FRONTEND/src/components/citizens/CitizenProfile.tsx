import { useEffect, useState } from "react";
import { getCitizen } from "../../api/endpoints";
import type { Citizen, ServiceRequest } from "../../types";
import StatusBadge from "../shared/StatusBadge";
import { X, User, Phone, MapPin, Calendar, ClipboardList } from "lucide-react";

interface CitizenProfileProps {
  nin: string;
  onClose: () => void;
}

export default function CitizenProfile({ nin, onClose }: CitizenProfileProps) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCitizen(nin).then((result) => {
      setCitizen(result.citizen);
      setRequests(result.requests);
      setLoading(false);
    });
  }, [nin]);

  if (loading || !citizen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{citizen.full_name}</h2>
            <p className="font-mono text-xs text-gray-500">NIN: {citizen.nin}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Verification */}
          <StatusBadge status={citizen.verification_status} size="md" />

          {/* Personal Info */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{citizen.full_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{citizen.phone_number}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{citizen.parish}, {citizen.district}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                Registered: {new Date(citizen.created_at).toLocaleDateString("en-GB")}
              </span>
            </div>
            {citizen.last_check_in && (
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Last Check-in: {new Date(citizen.last_check_in).toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
          </div>

          {/* Request History */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Service Requests ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-400">No requests found</p>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div>
                      <p className="font-mono text-xs font-medium text-primary">
                        {req.request_code}
                      </p>
                      <p className="text-xs text-gray-500">{req.description}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
