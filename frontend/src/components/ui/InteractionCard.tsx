interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  notes?: string;
  follow_up?: string;
}

interface InteractionCardProps {
  interaction: Interaction;
}

const InteractionCard: React.FC<InteractionCardProps> = ({ interaction }) => {
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
    </li>
  );
};

export default InteractionCard;
