interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  notes?: string;
  follow_up?: string;
}

interface InteractionCardProps {
  interaction: Interaction;
  onEdit?: () => void;
  onDelete?: () => void;
}

const InteractionCard: React.FC<InteractionCardProps> = ({ interaction, onEdit, onDelete }) => {
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
      <p className="mt-2 font-semibold text-gray-800">{interaction.outcome}</p>
      {interaction.notes && <p className="text-sm text-gray-700 mt-1">{interaction.notes}</p>}

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
