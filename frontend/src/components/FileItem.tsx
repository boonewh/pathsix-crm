import type { FileInfo } from "../pages/Vault";

export default function FileItem({
  file,
  onDownload,
  onDelete,
  canDelete,
}: {
  file: FileInfo;
  onDownload: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-2">
      <div>
        <div className="font-medium">{file.name}</div>
        <div className="text-sm text-gray-500">
          {Math.round(file.size / 1024)} KB • Uploaded by {file.uploadedBy} •{" "}
          {new Date(file.date).toLocaleDateString()}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={onDownload}
        >
          Download
        </button>
        {canDelete && (
          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
