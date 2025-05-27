import { FC } from "react";
import { Menu } from "@headlessui/react";
import { MoreVertical } from "lucide-react";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

interface Props {
  client: Client;
  editing: boolean;
  form: Partial<Client>;
  setForm: (form: Partial<Client>) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}

const ClientCard: FC<Props> = ({
  client,
  editing,
  form,
  setForm,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}) => {
  function confirmDelete() {
    if (window.confirm(`Are you sure you want to delete this ${USE_ACCOUNT_LABELS ? "account" : "client"}?`)) {
      onDelete();
    }
  }
  
  return (
    <li className="transition-shadow hover:shadow-md border border-gray-200 rounded-lg bg-white p-5 hover:border-blue-400">
      <div className="flex justify-between gap-4">
        {editing ? (
          <div className="flex flex-col flex-1 gap-2">
            <input
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
            <input
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <input
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
            <input
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
            />
          </div>
        ) : (
          <div className="flex-1">
            <p><strong>{client.name}</strong></p>
            <p className="text-sm text-gray-700 mb-1">{client.email}</p>
            <p className="text-sm text-gray-700 mb-1">{client.phone}</p>
            <p className="text-sm text-gray-500">{client.address}</p>
          </div>
        )}

        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 text-gray-500 hover:text-black">
            <MoreVertical className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg z-10 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onEdit}
                    className={`w-full text-left px-4 py-2 text-sm ${active ? "bg-gray-100" : ""}`}
                  >
                    Edit
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => confirmDelete()} // we’ll add this next
                    className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? "bg-gray-100" : ""}`}
                  >
                    Delete
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </li>
  );
};

export default ClientCard;
