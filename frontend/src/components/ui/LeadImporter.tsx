import React, { useState, useEffect } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/authContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

interface ColumnMapping {
  csvColumn: string;
  leadField: string;
}

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface ImportResult {
  message: string;
  successful_imports: number;
  failed_imports: number;
  warnings: string[];
  failures: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

export default function LeadImporter() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data.filter((u: User) => u.is_active));
      } catch (err) {
        setError('Failed to load users');
      }
    };
    loadUsers();
  }, [token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['.csv', '.xlsx'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

    if (!validTypes.includes(fileExtension)) {
      setError('Please upload a CSV or Excel (.xlsx) file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setIsProcessingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/import/leads/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to process file');
      }

      const preview: PreviewData = await res.json();
      setPreviewData(preview);

      const initialMappings: ColumnMapping[] = preview.headers.map(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        let suggestedField = '';
        if (normalizedHeader.includes('name') || normalizedHeader.includes('company')) suggestedField = 'name';
        else if (normalizedHeader.includes('contact') && normalizedHeader.includes('person')) suggestedField = 'contact_person';
        else if (normalizedHeader.includes('title')) suggestedField = 'contact_title';
        else if (normalizedHeader.includes('email')) suggestedField = 'email';
        else if (normalizedHeader.includes('phone') && !normalizedHeader.includes('secondary')) suggestedField = 'phone';
        else if (normalizedHeader.includes('secondaryphone')) suggestedField = 'secondary_phone';
        else if (normalizedHeader.includes('address')) suggestedField = 'address';
        else if (normalizedHeader.includes('city')) suggestedField = 'city';
        else if (normalizedHeader.includes('state')) suggestedField = 'state';
        else if (normalizedHeader.includes('zip')) suggestedField = 'zip';
        else if (normalizedHeader.includes('note')) suggestedField = 'notes';
        else if (normalizedHeader.includes('type')) suggestedField = 'type';
        else if (normalizedHeader.includes('status')) suggestedField = 'lead_status';

        return {
          csvColumn: header,
          leadField: suggestedField
        };
      });

      setColumnMappings(initialMappings);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      setFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedUser) {
      setError('Please select a file and user');
      return;
    }

    const hasNameField = columnMappings.some(m => m.leadField === 'name');
    if (!hasNameField) {
      setError("'name' field is required.");
      return;
    }

    setIsUploading(true);
    setError('');
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assigned_user_email', selectedUser);
      formData.append('column_mappings', JSON.stringify(columnMappings));

      const res = await fetch(`${API_BASE}/import/leads/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const data = await res.json();
      setImportResult(data);
      setFile(null);
      setSelectedUser('');
      setPreviewData(null);
      setColumnMappings([]);

      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/import/leads/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lead_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const resetImport = () => {
    setFile(null);
    setSelectedUser('');
    setPreviewData(null);
    setColumnMappings([]);
    setImportResult(null);
    setError('');
    setIsProcessingFile(false);
    setIsUploading(false);
    setShowModal(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Leads
        </h3>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload a CSV or Excel file with lead data</li>
          <li>• Required field: <strong>name</strong> (Company Name)</li>
          <li>• Optional fields: contact info, phones, address, notes, etc.</li>
          <li>• You’ll map your columns in the next step</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {!previewData && !importResult && (
        <div className="space-y-6">
          <div>
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
              Assign leads to user: <span className="text-red-500">*</span>
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>{user.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
              Upload file: <span className="text-red-500">*</span>
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              disabled={isProcessingFile}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            {isProcessingFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                Processing file...
              </div>
            )}
          </div>
        </div>
      )}

      {previewData && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-900 mb-2">File Processed Successfully!</h4>
            <p className="text-sm text-green-800">
              Found {previewData.totalRows} rows with {previewData.headers.length} columns.
              Please map your columns to our lead fields below.
            </p>
          </div>

          <div>
            {columnMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-sm">{mapping.csvColumn}</div>
                  <div className="text-xs text-gray-500">
                    Sample: {previewData.rows[0]?.[index] || 'No data'}
                  </div>
                </div>
                <div className="flex-1">
                  <select
                    value={mapping.leadField}
                    onChange={(e) => {
                      const updated = [...columnMappings];
                      updated[index].leadField = e.target.value;
                      setColumnMappings(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Skip this column</option>
                    {['name', 'contact_person', 'contact_title', 'email', 'phone', 'phone_label', 'secondary_phone', 'secondary_phone_label', 'address', 'city', 'state', 'zip', 'notes', 'type', 'lead_status'].map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {previewData.totalRows} Leads
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-medium text-green-900">Import Completed</h4>
          </div>
          <p className="text-green-800 mb-2">{importResult.message}</p>
          <div className="text-sm text-green-700">
            <p>✅ Successfully imported: {importResult.successful_imports} leads</p>
            {importResult.failed_imports > 0 && (
              <p>❌ Failed imports: {importResult.failed_imports}</p>
            )}
            {importResult.warnings && importResult.warnings.length > 0 && (
              <p>⚠️ Warnings: {importResult.warnings.length}</p>
            )}
          </div>

          {importResult.failures && importResult.failures.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                View failed imports ({importResult.failures.length})
              </button>
            </div>
          )}

          <button
            onClick={resetImport}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Import Another File
          </button>
        </div>
      )}

      {showModal && importResult?.failures && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Failed Imports</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="space-y-3">
                {importResult.failures.map((failure, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-medium text-red-900">
                      Row {failure.row}
                    </p>
                    <p className="text-sm text-red-700">{failure.error}</p>
                    <pre className="text-xs text-gray-500 overflow-x-auto mt-1">
                      {JSON.stringify(failure.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
