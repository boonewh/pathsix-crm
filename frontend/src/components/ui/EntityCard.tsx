import { FC, ReactNode } from "react";
import { Menu } from "@headlessui/react";
import { MoreVertical } from "lucide-react";

interface EntityCardProps {
  title: string;
  details?: React.ReactNode;
  editing?: boolean;
  editForm?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const EntityCard: FC<EntityCardProps> = ({
  title,
  details,
  editing = false,
  editForm,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}) => {
  function confirmDelete() {
    if (window.confirm("Are you sure you want to delete this item?")) {
      onDelete?.();
    }
  }

  return (
    <li className="transition-shadow hover:shadow-md border border-gray-200 rounded-lg bg-white p-5 hover:border-blue-400">
      <div className="flex justify-between gap-4">
        <div className="flex-1">
          {editing ? editForm : (
            <>
              <p><strong>{title}</strong></p>
              <div className="text-sm text-gray-700 space-y-1">
                {details}
              </div>
            </>
          )}
          {editing && (
            <div className="mt-2 flex gap-2">
                <button
                onClick={onSave}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                Save
                </button>
                <button
                onClick={onCancel}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                Cancel
                </button>
            </div>
            )}
        </div>

        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 text-gray-500 hover:text-black">
            <MoreVertical className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg z-10 focus:outline-none">
            <div className="py-1">
              {onEdit && (
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
              )}
              {onDelete && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={confirmDelete}
                      className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? "bg-gray-100" : ""}`}
                    >
                      Delete
                    </button>
                  )}
                </Menu.Item>
              )}
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </li>
  );
};

export default EntityCard;