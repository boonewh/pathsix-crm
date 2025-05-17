interface InteractionModalProps {
  title: string;
  date: string;
  outcome: string;
  summary?: string;
  notes?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  profile_link?: string;
  onClose: () => void;
  calendarLink?: string;
}

export default function InteractionModal({
  title,
  date,
  outcome,
  summary,
  notes,
  contact_person,
  email,
  phone,
  profile_link,
  onClose,
  calendarLink,
}: InteractionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-1">Date: {date}</p>

        <p className="text-sm mb-1">
          <strong>Outcome:</strong> {outcome}
        </p>

        {summary && (
          <p className="text-sm mb-1">
            <strong>Summary:</strong> {summary}
          </p>
        )}

        {notes && (
          <p className="text-sm text-gray-500 mt-1">
            <strong>Notes:</strong> {notes}
          </p>
        )}

        <div className="text-sm text-gray-700 space-y-1 mt-4">
          {contact_person && <p><strong>Contact:</strong> {contact_person}</p>}
          {phone && (
            <p><strong>Phone:</strong> <a href={`tel:${phone}`} className="text-blue-600 underline">{phone}</a></p>
          )}
          {email && (
            <p><strong>Email:</strong> <a href={`mailto:${email}`} className="text-blue-600 underline">{email}</a></p>
          )}
          {profile_link && (
            <p><a href={profile_link} className="text-blue-600 underline">View full profile →</a></p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {calendarLink && (
            <a
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Add to Google Calendar
            </a>
          )}
          <button
            onClick={onClose}
            className="text-sm bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
