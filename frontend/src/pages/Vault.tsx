import { useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import { listFiles, uploadFiles, deleteFile, downloadFile } from "../api/storage";
import { useAuth } from "@/authContext";

export type FileInfo = {
  id: number;
  name: string;
  size: number;
  uploadedBy: string;
  date: string;
  mimetype?: string;
};

export default function Vault() {
  const { isAuthenticated, user, token } = useAuth();
  const authed = isAuthenticated;
  const canUpload = !!user && user.roles?.includes("file_uploads");
  const canDelete = canUpload;

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  async function refresh() {
    if (!authed || !token) {
      setLoading(false);
      setFiles([]);
      setAuthError("You must be logged in to view files.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const data = await listFiles(token);
      setFiles(data);
    } catch {
      setFiles([]);
      setAuthError("You must be logged in to view files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpload(selected: File[]) {
  if (!canUpload || !token) return;
  await uploadFiles(selected, token);
  await refresh();
  }

  async function handleDelete(id: number) {
  if (!canDelete || !token) return;
  await deleteFile(id, token);
  await refresh();
  }

  async function handleDownload(id: number, name: string) {
  if (!token) return;
  const blob = await downloadFile(id, token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">File Storage</h1>

  {canUpload && <FileUpload onUpload={handleUpload} />}

      {!authed ? (
        <div className="text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-4">
          Please log in via the CRM to access Vault.
        </div>
      ) : (
        <FileList
          files={files}
          loading={loading}
          onDelete={handleDelete}
          onDownload={handleDownload}
          canDelete={canDelete}
          authError={authError}
        />
      )}
    </div>
  );
}
