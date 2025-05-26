
import type { InteractionFormProps } from "./InteractionForm.types";

export default function InteractionForm(props: InteractionFormProps) {
  const { form, updateForm, onSubmit, onCancel, isEditing } = props;

  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm font-medium text-gray-700">Contact Date</label>
      <input
        type="datetime-local"
        value={form.contact_date}
        onChange={(e) => updateForm({ ...form, contact_date: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <input
        placeholder="Summary"
        value={form.summary}
        onChange={(e) => updateForm({ ...form, summary: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <input
        placeholder="Outcome"
        value={form.outcome}
        onChange={(e) => updateForm({ ...form, outcome: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => updateForm({ ...form, notes: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
        rows={3}
      />
      <label className="block text-sm font-medium text-gray-700">Next Follow-up Date (optional)</label>
      <input
        type="datetime-local"
        value={form.follow_up ?? ""}
        onChange={(e) => updateForm({ ...form, follow_up: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {isEditing ? "Update" : "Save"} Interaction
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
