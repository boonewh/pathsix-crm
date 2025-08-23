import FileItem from "./FileItem";
import type { FileInfo } from "../pages/Vault";

export default function FileList({
  files,
  loading,
  onDownload,
  onDelete,
  canDelete,
  authError,
}: {
  files: FileInfo[];
  loading: boolean;
  onDownload: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  canDelete: boolean;
  authError?: string | null;
}) {
  if (loading) {
    return <div className="text-gray-500 py-8">Loading files…</div>;
  }

  if (authError) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
        {authError}
      </div>
    );
  }

  if (!files.length) {
    return <div className="text-gray-500 text-center py-8">No files uploaded yet.</div>;
  }

  return (
    <div>
      {files.map((f) => (
        <FileItem
          key={f.id}
          file={f}
          onDownload={() => onDownload(f.id, f.name)}
          onDelete={() => onDelete(f.id)}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
