import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";

export default function Reports() {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

const fetchReports = async () => {
  setLoading(true);
  setReportData(null);

  try {
    const res = await apiFetch("/reports/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        start_date: startDate || null,
        end_date: endDate || null,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch reports");
    }

    const data = await res.json();
    setReportData(data);
  } catch (err) {
    console.error("Report fetch failed:", err);
    setReportData(null);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  if (token) {
    fetchReports();
  }
}, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            className="border rounded px-3 py-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            className="border rounded px-3 py-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={fetchReports}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : reportData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Total Leads</h2>
            <p className="text-2xl">{reportData.lead_count}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Converted Leads</h2>
            <p className="text-2xl">{reportData.converted_leads}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Total Projects</h2>
            <p className="text-2xl">{reportData.project_count}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Won Projects</h2>
            <p className="text-2xl">{reportData.won_projects}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Lost Projects</h2>
            <p className="text-2xl">{reportData.lost_projects}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold">Total Won Value</h2>
            <p className="text-2xl">${reportData.total_won_value?.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
}
