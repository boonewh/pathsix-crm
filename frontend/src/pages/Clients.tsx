import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { useAuth, userHasRole } from "@/authContext";
import { Mail, Phone, MapPin, User, StickyNote, Wrench, LayoutGrid, List, Plus, Filter, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import CompanyForm from "@/components/ui/CompanyForm";
import { Client } from "@/types";
import { apiFetch } from "@/lib/api";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import StatusTabs from "@/components/ui/StatusTabs";
import { formatPhoneNumber } from "@/lib/phoneUtils";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

// Account type options for filtering
const ACCOUNT_TYPE_OPTIONS = [
  'None', 'Oil & Gas', 'Secondary Containment', 'Tanks', 'Pipe', 
  'Rental', 'Food and Beverage', 'Bridge', 'Culvert'
] as const;

// Smart default for filter visibility based on screen size
const getDefaultFilterVisibility = () => {
  if (typeof window === 'undefined') return true; // SSR fallback
  return window.innerWidth >= 1024; // lg breakpoint
};

// Table component for proper data table view
function ClientsTable({ 
  clients, 
  onEdit, 
  onDelete,
  sortField,
  sortDirection,
  onSort,
  getSortIcon
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: number) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  getSortIcon: (field: string) => string;
}) {
  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      onDelete(client.id);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('name')}
            >
              {USE_ACCOUNT_LABELS ? 'Account' : 'Client'} Name <span className="ml-1">{getSortIcon('name')}</span>
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('contact_person')}
            >
              Contact <span className="ml-1">{getSortIcon('contact_person')}</span>
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('type')}
            >
              Type <span className="ml-1">{getSortIcon('type')}</span>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Contact Info
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('created_at')}
            >
              Created <span className="ml-1">{getSortIcon('created_at')}</span>
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">
                  <Link
                    to={`/clients/${client.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.name}
                  </Link>
                </div>
                {client.address && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {client.city && client.state ? `${client.city}, ${client.state}` : client.address}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div>
                  {client.contact_person && (
                    <div className="font-medium text-gray-900">{client.contact_person}</div>
                  )}
                  {client.contact_title && (
                    <div className="text-sm text-gray-500">{client.contact_title}</div>
                  )}
                  {!client.contact_person && !client.contact_title && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {client.type || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="space-y-1">
                  {client.email && (
                    <div>
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                        {formatPhoneNumber(client.phone)}
                      </a>
                      {client.phone_label && (
                        <span className="text-gray-500 text-xs ml-1">({client.phone_label})</span>
                      )}
                    </div>
                  )}
                  {client.secondary_phone && (
                    <div>
                      <a href={`tel:${client.secondary_phone}`} className="text-blue-600 hover:underline">
                        {formatPhoneNumber(client.secondary_phone)}
                      </a>
                      {client.secondary_phone_label && (
                        <span className="text-gray-500 text-xs ml-1">({client.secondary_phone_label})</span>
                      )}
                    </div>
                  )}
                  {!client.email && !client.phone && !client.secondary_phone && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                <button
                  onClick={() => onEdit(client)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                  title={`Edit ${USE_ACCOUNT_LABELS ? 'account' : 'client'}`}
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  title={`Delete ${USE_ACCOUNT_LABELS ? 'account' : 'client'}`}
                >
                  <Trash2 size={14} />
                </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {clients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No {USE_ACCOUNT_LABELS ? 'accounts' : 'clients'} found.</p>
        </div>
      )}
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
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
  } = usePagination('clients');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'clients');
  
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
    entityType: 'clients',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'clients');
      updateSortOrder(legacySort);
    }
  });

  // Type filter (preserves user's filter choice)
  const { statusFilter: typeFilter, setStatusFilter: setTypeFilter } = useStatusFilter('clients_type');

  // Smart filter visibility - default open on desktop, closed on mobile
  const [showFilters, setShowFilters] = useState<boolean>(getDefaultFilterVisibility());

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
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
    notes: "",
    type: "None", 
  });

  const [error, setError] = useState("");
  const { token, user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
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
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/clients/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClients(data.clients);
        setTotal(data.total);
        setError(""); // Reset error on successful fetch
      } catch (err) {
        setError("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();

    if (userHasRole(user, "admin")) {
      fetch("/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableUsers(data.filter((u: any) => u.is_active)));
    }
  }, [token, currentPage, perPage, sortOrder]);

  // Filter logic - only type filter now
  const filteredClients = clients.filter(client => {
    // Type filter
    if (typeFilter !== 'all' && client.type !== typeFilter) return false;
    return true;
  });

  // Apply unified sorting to filtered data
  const sortedClients = sortData(filteredClients);

  const handleTableEdit = (client: Client) => {
    setForm({
      ...client,
      phone_label: client.phone_label || "work",
      secondary_phone_label: client.secondary_phone_label || "mobile",
    });
    setEditingId(client.id);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${USE_ACCOUNT_LABELS ? 'account' : 'client'}?`)) return;

    const res = await apiFetch(`/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      alert(`Failed to delete ${USE_ACCOUNT_LABELS ? 'account' : 'client'}`);
    }
  };

  const handleSave = async () => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/clients/" : `/clients/${editingId}`;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`Failed to save ${USE_ACCOUNT_LABELS ? 'account' : 'client'}`);

      const updatedRes = await apiFetch(`/clients/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullData = await updatedRes.json();
      setClients(fullData.clients);
      setTotal(fullData.total);
      handleCancel();
    } catch (err: any) {
      setError(err.message || `Failed to save ${USE_ACCOUNT_LABELS ? 'account' : 'client'}`);
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
      notes: "",
      type: "None",
    });
  };

  // Clear all filters - now only handles type filter
  const clearAllFilters = () => {
    setTypeFilter('all');
  };

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          {USE_ACCOUNT_LABELS ? "Accounts" : "Clients"}
        </h1>
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

          {/* New Account Button */}
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
                notes: "",
                type: "None",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New {USE_ACCOUNT_LABELS ? "Account" : "Client"}</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          {/* View Mode + Type Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: View Mode + Type Filters */}
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

              {/* Type Tabs */}
              <StatusTabs 
                statusFilter={typeFilter} 
                setStatusFilter={setTypeFilter}
                items={clients}
                statusField="type"
                statusOptions={ACCOUNT_TYPE_OPTIONS}
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
        <span className="font-medium">{sortedClients.length}</span> of {clients.length} {USE_ACCOUNT_LABELS ? 'accounts' : 'clients'}
        {typeFilter !== 'all' && <span className="text-blue-600"> • {typeFilter}</span>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading {USE_ACCOUNT_LABELS ? 'accounts' : 'clients'}...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title={USE_ACCOUNT_LABELS ? "New Account" : "New Client"}
                editing
                onSave={handleSave}
                onCancel={handleCancel}
                editForm={
                  <CompanyForm
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
              {sortedClients.map((client) => (
                <EntityCard
                  key={client.id}
                  title={
                    <Link
                      to={`/clients/${client.id}`}
                      className="hover:underline font-medium text-base block"
                    >
                      {client.name}
                    </Link>
                  }
                  typeLabel={client.type || "None"}
                  editing={editingId === client.id}
                  onEdit={() => handleTableEdit(client)}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(client.id)}
                  editForm={
                    <CompanyForm
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  }
                  details={
                    <ul className="text-sm text-gray-600 space-y-2">
                      {client.contact_person && (
                        <li className="flex items-start gap-2">
                          <User size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>{client.contact_person}</div>
                            {client.contact_title && (
                              <div className="text-gray-500 text-sm italic">{client.contact_title}</div>
                            )}
                          </div>
                        </li>
                      )}
                      {client.email && (
                        <li className="flex items-start gap-2">
                          <Mail size={14} className="mt-[2px] flex-shrink-0" />
                          <a href={`mailto:${client.email}`} className="text-blue-600 underline break-all">
                            {client.email}
                          </a>
                        </li>
                      )}
                      {client.phone && (
                        <li className="flex items-start gap-2">
                          <Phone size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>
                              <a href={`tel:${client.phone}`} className="text-blue-600 underline">
                                {formatPhoneNumber(client.phone)}
                              </a>
                              {client.phone_label && (
                                <span className="text-muted-foreground text-sm ml-1">
                                  ({client.phone_label})
                                </span>
                              )}
                            </div>
                            {client.secondary_phone && (
                              <div>
                                <a href={`tel:${client.secondary_phone}`} className="text-blue-600 underline">
                                  {formatPhoneNumber(client.secondary_phone)}
                                </a>
                                {client.secondary_phone_label && (
                                  <span className="text-muted-foreground text-sm ml-1">
                                    ({client.secondary_phone_label})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      )}
                      {(client.address || client.city || client.state || client.zip) && (
                        <li className="flex items-start gap-2">
                          <MapPin size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            {client.address && <div>{client.address}</div>}
                            <div>
                              {[client.city, client.state].filter(Boolean).join(", ")}
                              {client.zip ? ` ${client.zip}` : ""}
                            </div>
                          </div>
                        </li>
                      )}
                      {client.notes && (
                        <li className="flex items-start gap-2">
                          <StickyNote size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="break-words">{client.notes}</div>
                        </li>
                      )}
                    </ul>
                  }
                  extraMenuItems={
                    userHasRole(user, "admin") ? (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedClientId(client.id);
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
            <ClientsTable
              clients={sortedClients}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              getSortIcon={getSortIcon}
            />
          )}

          {sortedClients.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {USE_ACCOUNT_LABELS ? 'accounts' : 'clients'} found</h3>
              <p className="text-gray-500 mb-4">
                {activeFiltersCount > 0 
                  ? `No ${USE_ACCOUNT_LABELS ? 'accounts' : 'clients'} match your current filters. Try adjusting your search criteria.`
                  : `Get started by creating your first ${USE_ACCOUNT_LABELS ? 'account' : 'client'}.`
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

      {/* Only show pagination at bottom when there are multiple pages */}
      {filteredClients.length > perPage && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Simple pagination info */}
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, filteredClients.length)} of {filteredClients.length}
            </span>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {Math.ceil(filteredClients.length / perPage)}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredClients.length / perPage)))}
                disabled={currentPage === Math.ceil(filteredClients.length / perPage)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign {USE_ACCOUNT_LABELS ? "Account" : "Client"}</h2>

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
                  setSelectedClientId(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId}
                onClick={async () => {
                  const res = await apiFetch(`/clients/${selectedClientId}/assign`, {
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
                    setSelectedClientId(null);
                    const updatedRes = await apiFetch(`/clients/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const fullData = await updatedRes.json();
                    setClients(fullData.clients);
                    setTotal(fullData.total);
                  } else {
                    alert(`Failed to assign ${USE_ACCOUNT_LABELS ? 'account' : 'client'}.`);
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
                <h2 className="text-lg font-semibold">
                  Edit {USE_ACCOUNT_LABELS ? "Account" : "Client"}
                </h2>
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
              
              <CompanyForm
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