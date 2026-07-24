import { useState } from "react";
import type { ResourceAllocation } from "../../types";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

interface DistributionFormProps {
  resources: ResourceAllocation[];
  onClose: () => void;
  onDistribute: () => void;
}

export default function DistributionForm({ resources, onClose, onDistribute }: DistributionFormProps) {
  const [selectedResource, setSelectedResource] = useState(resources[0]?.id || 0);
  const [quantity, setQuantity] = useState(10);

  const handleSubmit = () => {
    toast.success("Distribution logged successfully");
    onDistribute();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Log Resource Distribution">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Resource Type</label>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {resources
              .filter((r) => r.distribution_status !== "fully_distributed")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.resource_type} — {r.parish} ({r.quantity - r.distributed_count} remaining)
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Confirm Distribution
          </button>
        </div>
      </div>
    </Modal>
  );
}
