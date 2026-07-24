import { useState } from "react";
import type { ServiceRequest } from "../../types";
import StatusBadge from "../shared/StatusBadge";
import { X } from "lucide-react";

interface RequestCardProps {
  request: ServiceRequest;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "reject", notes: string) => void;
}

export default function RequestCard({ request, onClose, onAction }: RequestCardProps) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{request.request_code}</h2>
            <p className="text-xs text-gray-500">Service Request Detail</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} size="md" />
            <StatusBadge status={request.priority} size="md" />
          </div>

          {/* Citizen Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="text-xs font-semibold uppercase text-gray-500">Citizen</h4>
            <p className="mt-1 font-medium text-gray-900">{request.citizen_name}</p>
            <p className="text-sm text-gray-600">NIN: {request.citizen_nin}</p>
          </div>

          {/* Request Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Description</h4>
            <p className="mt-1 text-sm text-gray-700">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Type</h4>
              <StatusBadge status={request.request_type} size="md" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Submitted Via</h4>
              <p className="mt-1 text-sm font-medium uppercase text-gray-700">
                {request.submitted_via}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Created</h4>
              <p className="mt-1 text-sm text-gray-700">
                {new Date(request.created_at).toLocaleString("en-GB")}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Last Updated</h4>
              <p className="mt-1 text-sm text-gray-700">
                {new Date(request.updated_at).toLocaleString("en-GB")}
              </p>
            </div>
          </div>

          {/* Notes */}
          {request.parish_chief_notes && (
            <div className="rounded-lg bg-yellow-50 p-4">
              <h4 className="text-xs font-semibold uppercase text-yellow-700">Chief Notes</h4>
              <p className="mt-1 text-sm text-yellow-800">{request.parish_chief_notes}</p>
            </div>
          )}

          {/* Action */}
          {(request.status === "submitted" || request.status === "under_review") && (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => onAction(request.id, "approve", notes)}
                  className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onAction(request.id, "reject", notes)}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
