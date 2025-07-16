import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { Mail, Phone, MapPin, Flag, User, StickyNote, Wrench, LayoutGrid, List, Plus, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import { Link } from "react-router-dom";
import LeadForm from "@/components/ui/LeadForm";
import { Lead } from "@/types";
import { apiFetch } from "@/lib/api";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import StatusTabs from "@/components/ui/StatusTabs";
import LeadsTable from "@/components/ui/LeadsTable";
import PaginationControls from "@/components/ui/PaginationControls";
import { formatPhoneNumber } from "@/lib/phoneUtils";

// Lead status options for filtering
const LEAD_STATUS_OPTIONS = ['open', 'qualified', 'proposal', 'closed'] as const;

// Lead status configuration
const LEAD_STATUS_CONFIG = {
  statuses: LEAD_STATUS_OPTIONS,
  colors: {
    open: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-orange-100 text-orange-800', 
    proposal: 'bg-blue-100 text-blue-800',
    closed: 'bg-red-100 text-red-800'
  },
  icons: {
    open: '🟡',
    qualified: '🟠',
    proposal: '🔵', 
    closed: '🔴'
  }
};

// Smart default for filter visibility based on screen size
const getDefaultFilterVisibility = () => {
  if (typeof window === 'undefined') return true; // SSR fallback
  return window.innerWidth >= 1024; // lg breakpoint
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Use pagination hook
  const {
    perPage,
    sortOrder,
    viewMode,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
    updateViewMode,
  } = usePagination('leads');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'leads');
  
  const {
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
    sortData,
    cardSortOptions,
    currentCardValue,
    setCardSort
  } = useSorting({
    entityType: 'leads',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'leads');
      updateSortOrder(legacySort);
    }
  });

  // Status and type filters (preserves user's filter choice)
  const { statusFilter, setStatusFilter } = useStatusFilter('leads');

  // Smart filter visibility - default open on desktop, closed on mobile
  const [showFilters, setShowFilters] = useState<boolean>(getDefaultFilterVisibility());

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    phone_label: "work",
    secondary_phone: "",
    secondary_phone_label: "mobile",
    address: "",
    city: "",
    state: "",
    zip: "",
    lead_status: "open",
    notes: "",
    type: "None",
  });

  const [error, setError] = useState("");
  const { token, user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);

  // Update filter visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only auto-adjust if user hasn't manually toggled filters
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen && !showFilters) {
        // Don't auto-open if user explicitly closed them
      } else if (!isLargeScreen && showFilters) {
        // Don't auto-close if user explicitly opened them
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showFilters]);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/leads/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLeads(data.leads);
        setTotal(data.total);
        setError(""); // Reset error on successful fetch
      } catch (err) {
        setError("Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    if (userHasRole(user, "admin")) {
      fetch("/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableUsers(data.filter((u: any) => u.is_active)));
    }
  }, [token, user, currentPage, perPage, sortOrder]);

  // Advanced filtering logic
  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (statusFilter !== 'all' && lead.lead_status !== statusFilter) return false;
    
    return true;
  });

  // Apply unified sorting to filtered data
  const sortedLeads = sortData(filteredLeads);

  const handleTableEdit = (lead: Lead) => {
    setForm({
      ...lead,
      phone_label: lead.phone_label || "work",
      secondary_phone_label: lead.secondary_phone_label || "mobile",
    });
    setEditingId(lead.id);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    const res = await apiFetch(`/leads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      alert("Failed to delete lead");
    }
  };

  const handleSave = async () => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/leads/" : `/leads/${editingId}`;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save lead");

      const updatedRes = await apiFetch(`/leads/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullData = await updatedRes.json();
      setLeads(fullData.leads);
      setTotal(fullData.total);
      handleCancel();
    } catch (err: any) {
      setError(err.message || "Failed to save lead");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setCreating(false);
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      phone_label: "work",
      secondary_phone: "",
      secondary_phone_label: "mobile",
      address: "",
      city: "",
      state: "",
      zip: "",
      lead_status: "open",
      notes: "",
      type: "None",
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
  };

  const activeFiltersCount = [statusFilter].filter(f => f !== 'all').length;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors flex-1 sm:flex-none justify-center ${
              activeFiltersCount > 0 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[20px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* New Lead Button */}
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
              setForm({
                name: "",
                contact_person: "",
                email: "",
                phone: "",
                phone_label: "work",
                secondary_phone: "",
                secondary_phone_label: "mobile",
                address: "",
                city: "",
                state: "",
                zip: "",
                lead_status: "open",
                notes: "",
                type: "None",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Lead</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          {/* View Mode + Status + Type Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: View Mode + Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* View Toggle */}
              <div className="flex bg-white rounded-lg p-1 border">
                <button 
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => updateViewMode('cards')}
                >
                  <LayoutGrid size={16} />
                  Cards
                </button>
                <button 
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => updateViewMode('table')}
                >
                  <List size={16} />
                  Table
                </button>
              </div>

              {/* Status Tabs */}
              <StatusTabs 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter}
                items={leads}
                statusField="lead_status"
                statusOptions={LEAD_STATUS_CONFIG.statuses}
                totalCount={total}              // ← this is what updates "All"
                showTotalForAll                 // ← this tells StatusTabs to use totalCount
              />

            </div>
          </div>

          {/* Sort + Per Page Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Sort Control - different for cards vs tables */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
              {viewMode === 'cards' ? (
                <select 
                  value={currentCardValue} 
                  onChange={(e) => setCardSort(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white"
                >
                  {cardSortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-600">
                  Click table headers to sort
                </span>
              )}
            </div>

            {/* Per Page Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Per page:</label>
              <select 
                value={perPage} 
                onChange={(e) => updatePerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white w-20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="font-medium">{leads.length}</span> of {total} leads
        {statusFilter !== 'all' && <span className="text-blue-600"> • {statusFilter}</span>}
      </div>

      {total > perPage && (
        <PaginationControls
          currentPage={currentPage}
          perPage={perPage}
          total={total}
          sortOrder={sortOrder}
          onPageChange={setCurrentPage}
          onPerPageChange={updatePerPage}
          onSortOrderChange={updateSortOrder}
          entityName="leads"
          className="border-b pb-4 mb-4"
        />
      )}


      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading leads...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title="New Lead"
                editing
                onSave={handleSave}
                onCancel={handleCancel}
                editForm={
                  <LeadForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                }
              />
            </div>
          )}

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedLeads.map((lead) => (
                <EntityCard
                  key={lead.id}
                  title={
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-blue-600 hover:underline font-medium text-base block"
                    >
                      {lead.name}
                    </Link>
                  }
                  typeLabel={lead.type || "None"}
                  editing={editingId === lead.id}
                  onEdit={() => handleTableEdit(lead)}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(lead.id)}
                  editForm={
                    <LeadForm
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  }
                  details={
                    <ul className="text-sm text-gray-600 space-y-2">
                      {lead.lead_status && (
                        <li className="flex items-center gap-2">
                          <Flag size={14} />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            LEAD_STATUS_CONFIG.colors[lead.lead_status as keyof typeof LEAD_STATUS_CONFIG.colors] || 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {LEAD_STATUS_CONFIG.icons[lead.lead_status as keyof typeof LEAD_STATUS_CONFIG.icons]} 
                            {lead.lead_status.toUpperCase()}
                          </span>
                        </li>
                      )}
                      {lead.contact_person && (
                        <li className="flex items-start gap-2">
                          <User size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>{lead.contact_person}</div>
                            {lead.contact_title && (
                              <div className="text-gray-500 text-sm italic">{lead.contact_title}</div>
                            )}
                          </div>
                        </li>
                      )}
                      {lead.email && (
                        <li className="flex items-start gap-2">
                          <Mail size={14} className="mt-[2px] flex-shrink-0" />
                          <a href={`mailto:${lead.email}`} className="text-blue-600 underline break-all">
                            {lead.email}
                          </a>
                        </li>
                      )}
                      {lead.phone && (
                        <li className="flex items-start gap-2">
                          <Phone size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>
                              <a href={`tel:${lead.phone}`} className="text-blue-600 underline">
                                {formatPhoneNumber(lead.phone)}
                              </a>
                              {lead.phone_label && (
                                <span className="text-muted-foreground text-sm ml-1">
                                  ({lead.phone_label})
                                </span>
                              )}
                            </div>
                            {lead.secondary_phone && (
                              <div>
                                <a href={`tel:${lead.secondary_phone}`} className="text-blue-600 underline">
                                  {formatPhoneNumber(lead.secondary_phone)}
                                </a>
                                {lead.secondary_phone_label && (
                                  <span className="text-muted-foreground text-sm ml-1">
                                    ({lead.secondary_phone_label})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      )}
                      {(lead.address || lead.city || lead.state || lead.zip) && (
                        <li className="flex items-start gap-2">
                          <MapPin size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            {lead.address && <div>{lead.address}</div>}
                            <div>
                              {[lead.city, lead.state].filter(Boolean).join(", ")}
                              {lead.zip ? ` ${lead.zip}` : ""}
                            </div>
                          </div>
                        </li>
                      )}
                      {lead.notes && (
                        <li className="flex items-start gap-2">
                          <StickyNote size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="break-words">{lead.notes}</div>
                        </li>
                      )}
                    </ul>
                  }
                  extraMenuItems={
                    userHasRole(user, "admin") ? (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setShowAssignModal(true);
                        }}
                      >
                        Assign
                      </button>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <LeadsTable
              leads={sortedLeads}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              statusConfig={LEAD_STATUS_CONFIG}
            />
          )}

          {sortedLeads.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-4">
                {activeFiltersCount > 0 
                  ? "No leads match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first lead."
                }
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {total > perPage && (
        <PaginationControls
          currentPage={currentPage}
          perPage={perPage}
          total={total}
          sortOrder={sortOrder}
          onPageChange={setCurrentPage}
          onPerPageChange={updatePerPage}
          onSortOrderChange={updateSortOrder}
          entityName="leads"
          className="mt-6 pt-4 border-t border-gray-200"
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign Lead</h2>

            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId(null);
                  setSelectedLeadId(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId}
                onClick={async () => {
                  const res = await apiFetch(`/leads/${selectedLeadId}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setSelectedLeadId(null);
                    const updatedRes = await apiFetch(`/leads/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const fullData = await updatedRes.json();
                    setLeads(fullData.leads);
                    setTotal(fullData.total);
                  } else {
                    alert("Failed to assign lead.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Lead</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingId(null);
                    handleCancel();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <LeadForm
                form={form}
                setForm={setForm}
                onSave={async () => {
                  await handleSave();
                  setShowEditModal(false);
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  handleCancel();
                }}
              />
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}