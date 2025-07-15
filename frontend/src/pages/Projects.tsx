import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import EntityCard from "@/components/ui/EntityCard";
import { Project } from "@/types";
import ProjectForm from "@/components/ui/ProjectForm";
import { FormWrapper } from "@/components/ui/FormWrapper";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import StatusTabs from "@/components/ui/StatusTabs";
import ProjectsTable from "@/components/ui/ProjectsTable";
import { LayoutGrid, List, Plus, Filter, ChevronDown, ChevronUp } from "lucide-react";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

// Project status options for filtering
const PROJECT_STATUS_OPTIONS = ['pending', 'won', 'lost'] as const;

// Project status configuration
const PROJECT_STATUS_CONFIG = {
  statuses: PROJECT_STATUS_OPTIONS,
  colors: {
    pending: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  },
  icons: {
    pending: '🟡',
    won: '🟢',
    lost: '🔴'
  }
};

// Smart default for filter visibility based on screen size
const getDefaultFilterVisibility = () => {
  if (typeof window === 'undefined') return true; // SSR fallback
  return window.innerWidth >= 1024; // lg breakpoint
};

export default function Projects() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Use pagination hook with view mode support
  const {
    perPage,
    sortOrder,
    viewMode,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
    updateViewMode,
  } = usePagination('projects');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'projects');
  
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
    entityType: 'projects',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'projects');
      updateSortOrder(legacySort);
    }
  });

  // Status filter (preserves user's filter choice)
  const { statusFilter, setStatusFilter } = useStatusFilter('projects');

  // Smart filter visibility - default open on desktop, closed on mobile
  const [showFilters, setShowFilters] = useState<boolean>(getDefaultFilterVisibility());

  const [form, setForm] = useState<Partial<Project>>({});
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");

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
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [projRes, clientRes, leadRes] = await Promise.all([
          apiFetch(`/projects/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          apiFetch("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch("/leads/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const projectsData = await projRes.json();
        const clients = await clientRes.json();
        const leads = await leadRes.json();

        const leadsArray = leads.leads || leads;
        const clientsArray = clients.clients || clients;

        setProjects(projectsData.projects);
        setTotal(projectsData.total);
        setClients(clientsArray.map((c: any) => ({ id: c.id, name: c.name })));
        setLeads(leadsArray.map((l: any) => ({ id: l.id, name: l.name })));
      } catch (err: any) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, currentPage, perPage, sortOrder]);

  // Filter projects by status
  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    return project.project_status === statusFilter;
  });

  // Apply unified sorting to filtered data
  const sortedProjects = sortData(filteredProjects);

  const handleTableEdit = (project: Project) => {
    setForm(project);
    setEditingId(project.id);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({});
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/projects/" : `/projects/${editingId}`;

      if (!form.project_worth) {
        form.project_worth = 0;
      }
      
      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save project");

      const updated = await apiFetch(`/projects/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await updated.json();
      setProjects(data.projects);
      setTotal(data.total);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const res = await apiFetch(`/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      alert("Failed to delete project");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm(project);
  };

  const handleCancel = () => {
    setEditingId(null);
    setCreating(false);
    setForm({});
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
  };

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
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

          {/* New Project Button */}
          <button
            onClick={() => {
              setCreating(true);
              setForm({});
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          {/* View Mode + Status Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: View Mode + Status Filters */}
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
                items={projects}
                statusField="project_status"
                statusOptions={PROJECT_STATUS_OPTIONS}
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
        <span className="font-medium">{sortedProjects.length}</span> of {projects.length} projects
        {statusFilter !== 'all' && <span className="text-blue-600"> • {statusFilter}</span>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading projects...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title="New Project"
                editing
                onSave={handleSave}
                onCancel={resetForm}
                editForm={
                  <ProjectForm
                    form={form}
                    setForm={setForm}
                    clients={clients}
                    leads={leads}
                    onSave={handleSave}
                    onCancel={resetForm}
                  />
                }
              />
            </div>
          )}

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProjects.map((project) => (
                <div key={project.id} className="w-full">
                  <EntityCard
                    title={
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-blue-600 hover:underline font-medium text-base block"
                      >
                        {project.project_name}
                      </Link>
                    }
                    typeLabel={project.type || "None"}
                    editing={editingId === project.id}
                    onEdit={() => handleEdit(project)}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    onDelete={() => handleDelete(project.id)}
                    editForm={
                      <FormWrapper>
                        <ProjectForm
                          form={form}
                          setForm={setForm}
                          clients={clients}
                          leads={leads}
                          onSave={handleSave}
                          onCancel={resetForm}
                        />
                      </FormWrapper>
                    }
                    details={
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            PROJECT_STATUS_CONFIG.colors[project.project_status as keyof typeof PROJECT_STATUS_CONFIG.colors] || 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {PROJECT_STATUS_CONFIG.icons[project.project_status as keyof typeof PROJECT_STATUS_CONFIG.icons]} 
                            {project.project_status?.toUpperCase() || 'PENDING'}
                          </span>
                        </li>
                        {project.project_description && <li>{project.project_description}</li>}

                        {project.client_id && project.client_name && (
                          <li>
                            <Link to={`/clients/${project.client_id}`} className="text-blue-600 hover:underline">
                              {USE_ACCOUNT_LABELS ? "Account" : "Client"}: {project.client_name}
                            </Link>
                          </li>
                        )}

                        {project.lead_id && project.lead_name && (
                          <li>
                            <Link to={`/leads/${project.lead_id}`} className="text-blue-600 hover:underline">
                              Lead: {project.lead_name}
                            </Link>
                          </li>
                        )}

                        {!project.client_id && !project.lead_id && project.primary_contact_name && (
                          <li className="text-blue-600">
                            Contact: {project.primary_contact_name}
                          </li>
                        )}

                        {!project.client_id && !project.lead_id && !project.primary_contact_name && (
                          <li className="text-yellow-600 text-xs font-medium">⚠️ Unassigned Project</li>
                        )}

                        {project.project_worth && <li>Worth: ${project.project_worth.toLocaleString()}</li>}
                        {project.project_start && <li>Start: {new Date(project.project_start).toLocaleDateString()}</li>}
                        {project.project_end && <li>End: {new Date(project.project_end).toLocaleDateString()}</li>}
                        {project.notes && (
                          <li className="whitespace-pre-wrap text-gray-600">
                            <strong>Notes:</strong> {project.notes?.trim() || "No notes provided."}
                          </li>
                        )}
                      </ul>
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <ProjectsTable
              projects={sortedProjects}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}

          {sortedProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== 'all' 
                  ? `No projects with status "${statusFilter}". Try adjusting your filters.`
                  : "Get started by creating your first project."
                }
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show all projects
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Only show pagination at bottom when there are multiple pages */}
      {filteredProjects.length > perPage && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Simple pagination info */}
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, filteredProjects.length)} of {filteredProjects.length}
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
                Page {currentPage} of {Math.ceil(filteredProjects.length / perPage)}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredProjects.length / perPage)))}
                disabled={currentPage === Math.ceil(filteredProjects.length / perPage)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
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
                <h2 className="text-lg font-semibold">Edit Project</h2>
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
              
              <ProjectForm
                form={form}
                setForm={setForm}
                clients={clients}
                leads={leads}
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