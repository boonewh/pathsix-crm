interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  notes?: string;
  follow_up?: string;
  client_name?: string;
  lead_name?: string;
}

interface InteractionCardProps {
  interaction: Interaction;
  onEdit?: () => void;
  onDelete?: () => void;
}

const InteractionCard: React.FC<InteractionCardProps> = ({ interaction, onEdit, onDelete }) => {
  function generateGoogleCalendarUrl(i: Interaction): string {
    const title = encodeURIComponent(`Follow-up: ${i.client_name || i.lead_name || "Unknown"}`);
    const details = encodeURIComponent(`Notes: ${i.notes || ""}\nNext Step: ${i.outcome || ""}`);
    const start = new Date(i.follow_up!).toISOString().replace(/[-:]|\.\d{3}/g, "");
    const end = start;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  return (
    <li className="bg-white border border-gray-200 rounded p-4 shadow-sm">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{new Date(interaction.contact_date).toLocaleString()}</span>
        {interaction.follow_up && (
          <span className="text-blue-600 font-medium">
            Follow-up: {new Date(interaction.follow_up).toLocaleString()}
          </span>
        )}
      </div>

      {interaction.outcome && (
        <p className="text-sm mt-2 text-gray-800">
          <strong>Next Step:</strong> {interaction.outcome}
        </p>
      )}

      {interaction.notes && <p className="text-sm text-gray-700 mt-1">{interaction.notes}</p>}

      {interaction.follow_up && (
        <div className="mt-2">
          <a
            href={generateGoogleCalendarUrl(interaction)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            Add to Google Calendar
          </a>
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-4 flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
};

export default InteractionCard;
