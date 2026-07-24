import { useEffect, useState } from "react";
import { getCitizens } from "../api/endpoints";
import type { Citizen } from "../types";
import SearchInput from "../components/shared/SearchInput";
import StatusBadge from "../components/shared/StatusBadge";
import CitizenProfile from "../components/citizens/CitizenProfile";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNin, setSelectedNin] = useState<string | null>(null);

  useEffect(() => {
    loadCitizens();
  }, [search]);

  const loadCitizens = async () => {
    setLoading(true);
    const result = await getCitizens(search || undefined);
    setCitizens(result.data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Citizen Registry</h1>
        <p className="text-sm text-gray-500">Search and manage citizen records</p>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by NIN, phone, or name..."
      />

      {loading ? (
        <LoadingSpinner />
      ) : citizens.length === 0 ? (
        <EmptyState title="No citizens found" message="Try a different search term" />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">NIN</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Parish</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {citizens.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedNin(c.nin)}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-primary">
                      {c.nin}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{c.phone_number}</td>
                    <td className="px-5 py-3 text-gray-600">{c.parish}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.verification_status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedNin && (
        <CitizenProfile nin={selectedNin} onClose={() => setSelectedNin(null)} />
      )}
    </div>
  );
}
