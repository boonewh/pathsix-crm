import type { InteractionFormProps } from "./InteractionForm.types";
import { useState } from "react";

function splitDateTime(datetime?: string): { date: string; time: string } {
  if (!datetime) return { date: "", time: "" };
  const [date, time = ""] = datetime.split("T");
  return { date, time: time.slice(0, 5) }; // "HH:MM"
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time || "08:00"}`;
}

export default function InteractionForm(props: InteractionFormProps) {
  const { form, updateForm, onSubmit, onCancel, isEditing } = props;

  const { date: contactDate, time: contactTime } = splitDateTime(form.contact_date);
  const { date: followDate, time: followTime } = splitDateTime(form.follow_up ?? "");

  const [showDateError, setShowDateError] = useState(false);

  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm font-medium text-gray-700">Contact Date</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={contactDate}
          onChange={(e) =>
            updateForm({
              ...form,
              contact_date: combineDateTime(e.target.value, contactTime),
            })
          }
          className={`w-full border rounded px-2 py-1 text-sm ${showDateError ? "border-red-500" : ""}`}
        />
        <input
          type="time"
          value={contactTime}
          onChange={(e) =>
            updateForm({
              ...form,
              contact_date: combineDateTime(contactDate, e.target.value),
            })
          }
          className={`w-full border rounded px-2 py-1 text-sm ${showDateError ? "border-red-500" : ""}`}
        />
      </div>

      {showDateError && (
        <p className="text-sm text-red-600 mt-1">
          Please enter a valid contact date.
        </p>
      )}

      <input
        placeholder="Summary"
        value={form.summary}
        onChange={(e) => updateForm({ ...form, summary: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />

      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => updateForm({ ...form, notes: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
        rows={3}
      />

      <label className="block text-sm font-medium text-gray-700">Next Follow-up (optional)</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={followDate}
          onChange={(e) =>
            updateForm({
              ...form,
              follow_up: combineDateTime(e.target.value, followTime),
            })
          }
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <input
          type="time"
          value={followTime}
          onChange={(e) =>
            updateForm({
              ...form,
              follow_up: combineDateTime(followDate, e.target.value),
            })
          }
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>

      <input
        placeholder="Next Step"
        value={form.outcome}
        onChange={(e) => updateForm({ ...form, outcome: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!form.contact_date || form.contact_date.startsWith("T")) {
              setShowDateError(true);
              return;
            }
            setShowDateError(false);
            onSubmit();
          }}
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
