interface Interaction {
  contact_date?: string;
  outcome?: string;
  notes?: string;
  follow_up?: string;
}

interface InteractionFormProps {
  form: Partial<Interaction>;
  setForm: (form: Partial<Interaction>) => void;
  onSave: () => void;
}

const InteractionForm: React.FC<InteractionFormProps> = ({ form, setForm, onSave }) => {
  return (
    <details className="border border-gray-300 rounded p-4 mb-6">
      <summary className="font-semibold cursor-pointer">New Interaction</summary>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Today's Date</label>
          <input
            type="datetime-local"
            className="border rounded w-full px-2 py-1"
            value={form.contact_date || ""}
            onChange={(e) => setForm({ ...form, contact_date: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
          <input
            placeholder="Outcome"
            className="border rounded w-full px-2 py-1"
            value={form.outcome || ""}
            onChange={(e) => setForm({ ...form, outcome: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            placeholder="Notes"
            className="border rounded w-full px-2 py-1"
            rows={3}
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up</label>
          <input
            type="datetime-local"
            className="border rounded w-full px-2 py-1"
            value={form.follow_up || ""}
            onChange={(e) => setForm({ ...form, follow_up: e.target.value })}
          />
        </div>

        <button
          onClick={onSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </details>
  );
};

export default InteractionForm;
