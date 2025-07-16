import { formatPhoneNumber } from "@/lib/phoneUtils";

interface InteractionModalProps {
  title: string;
  date: string;
  outcome: string;
  summary?: string;
  notes?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  phone_label?: string;
  secondary_phone?: string;
   secondary_phone_label?: "work" | "mobile";
  profile_link?: string;
  onClose: () => void;
  calendarLink?: string;
  outlookLink?: string;
  icsLink?: string;
  onMarkComplete?: () => void;
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
  phone_label,
  secondary_phone,
  secondary_phone_label,
  profile_link,
  onClose,
  calendarLink,
  outlookLink,
  icsLink,
  onMarkComplete,
}: InteractionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-1">Date: {date}</p>

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
        <br />
        <p className="text-sm mb-1">
          <strong>Next Step:</strong> {outcome}
        </p>

        <div className="text-sm text-gray-700 space-y-1 mt-4">
          {contact_person && <p><strong>Contact:</strong> {contact_person}</p>}

          {phone && (
            <p>
              <strong>Phone:</strong>{" "}
              <a href={`tel:${phone}`} className="text-blue-600 underline">
                {formatPhoneNumber(phone)}
              </a>
              {phone_label && (
                <span className="text-muted-foreground text-sm ml-1">
                  ({phone_label || "work"})
                </span>
              )}
            </p>
          )}
          {secondary_phone && (
            <p>
              <strong>Alt:</strong>{" "}
              <a href={`tel:${secondary_phone}`} className="text-blue-600 underline">
                {formatPhoneNumber(secondary_phone)}
              </a>
              {secondary_phone_label && (
                <span className="text-muted-foreground text-sm ml-1">
                  ({secondary_phone_label || "mobile"})
                </span>
              )}
            </p>
          )}

          {email && (
            <p><strong>Email:</strong> <a href={`mailto:${email}`} className="text-blue-600 underline">{email}</a></p>
          )}
          {profile_link && (
            <p><a href={profile_link} className="text-blue-600 underline">View full profile →</a></p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-start gap-2">
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
                    {outlookLink && (
            <a
              href={outlookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add to Outlook.com Calendar
            </a>
          )}
          {icsLink && (
            <a
              href={icsLink}
              className="text-sm bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
            >
              Apple / Outlook Manual Calendar Add
            </a>
          )}
          {onMarkComplete && (
            <button
              onClick={onMarkComplete}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Mark Complete
            </button>
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
