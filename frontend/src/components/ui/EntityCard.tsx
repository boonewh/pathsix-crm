import { FC, ReactNode } from "react";
import { Menu } from "@headlessui/react";
import { MoreVertical } from "lucide-react";

interface EntityCardProps {
  title: React.ReactNode;
  typeLabel?: string; 
  details?: React.ReactNode;
  editing?: boolean;
  editForm?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  extraMenuItems?: ReactNode;
}

const EntityCard: FC<EntityCardProps> = ({
  title,
  typeLabel,
  details,
  editing = false,
  editForm,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  extraMenuItems,
}) => {
  function confirmDelete() {
    if (window.confirm("Are you sure you want to delete this item?")) {
      onDelete?.();
    }
  }

  return (
    <div className="w-full transition-shadow hover:shadow-md border border-gray-200 rounded-lg bg-white p-5 hover:border-blue-400 h-full flex flex-col">
      <div className="flex justify-between gap-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          {editing ? editForm : (
            <>
              <div className="mb-3">
                <div className="font-medium text-gray-900 break-words">{title}</div>
                {typeLabel && (
                  <p className="text-xs text-gray-500 italic mt-1">
                    Type: {typeLabel}
                  </p>
                )}
              </div>
              
              {details && (
                <div className="text-sm text-gray-700">
                  {details}
                </div>
              )}
            </>
          )}
        </div>

        {(onEdit || onDelete || extraMenuItems) && !editing && (
          <div className="flex-shrink-0">
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
                  {extraMenuItems && (
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      {extraMenuItems}
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Menu>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityCard;