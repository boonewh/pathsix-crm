interface StatusTabsProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  items: any[];
  statusField: string;
  statusOptions: readonly string[];
  className?: string;
  totalCount?: number;
  showTotalForAll?: boolean;
}

export default function StatusTabs({ 
  statusFilter, 
  setStatusFilter, 
  items,
  statusField,
  statusOptions,
  className = "",
  totalCount,
  showTotalForAll
}: StatusTabsProps) {
  const getCounts = () => {
    const counts: Record<string, number> = {
      all: showTotalForAll && totalCount !== undefined ? totalCount : items.length
    };
    
    statusOptions.forEach(status => {
      counts[status] = items.filter(item => item[statusField] === status).length;
    });
    
    return counts;
  };

  const counts = getCounts();

  const tabs = [
    { key: 'all', label: 'All' },
    ...statusOptions.map(status => ({
      key: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setStatusFilter(tab.key)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            statusFilter === tab.key 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tab.label} ({counts[tab.key] || 0})
        </button>
      ))}
    </div>
  );
}