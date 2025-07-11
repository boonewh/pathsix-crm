import React, { useState, useEffect } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/authContext';
import { apiFetch } from '@/lib/api';

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

interface ValidationInfo {
  field: string;
  required: boolean;
  description: string;
  example?: string;
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'import'>('upload');
  const [showAllPreview, setShowAllPreview] = useState(false);

  // Lead field definitions based on your Lead model
  const leadFields: ValidationInfo[] = [
    { field: 'name', required: true, description: 'Company/Organization name', example: 'Acme Corporation' },
    { field: 'contact_person', required: false, description: 'Primary contact person name', example: 'John Smith' },
    { field: 'contact_title', required: false, description: 'Contact person job title', example: 'Operations Manager' },
    { field: 'email', required: false, description: 'Primary email address', example: 'john@acme.com' },
    { field: 'phone', required: false, description: 'Primary phone number', example: '(555) 123-4567' },
    { field: 'phone_label', required: false, description: 'Phone type (work, mobile, home)', example: 'work' },
    { field: 'secondary_phone', required: false, description: 'Secondary phone number', example: '(555) 987-6543' },
    { field: 'secondary_phone_label', required: false, description: 'Secondary phone type', example: 'mobile' },
    { field: 'address', required: false, description: 'Street address', example: '123 Main St' },
    { field: 'city', required: false, description: 'City name', example: 'Houston' },
    { field: 'state', required: false, description: 'State/Province', example: 'TX' },
    { field: 'zip', required: false, description: 'ZIP/Postal code', example: '77001' },
    { field: 'notes', required: false, description: 'Additional information', example: 'Potential customer from trade show' },
    { field: 'type', required: false, description: 'Business type (Oil & Gas, Secondary Containment, etc.)', example: 'Oil & Gas' },
    { field: 'lead_status', required: false, description: 'Lead status (open, qualified, proposal, closed)', example: 'open' }
  ];

  const businessTypes = [
    'None', 'Oil & Gas', 'Secondary Containment', 'Tanks', 'Pipe',
    'Rental', 'Food and Beverage', 'Bridge', 'Culvert'
  ];

  const leadStatuses = ['open', 'qualified', 'proposal', 'closed'];
  const phoneLabels = ['work', 'mobile', 'home', 'fax', 'other'];

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await apiFetch('/users/', {
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

    // Validate file type
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
      // Process file to get preview
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/import/leads/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to process file');
      }

      const preview: PreviewData = await res.json();
      setPreviewData(preview);
      
      // Initialize column mappings with smart defaults
      const initialMappings: ColumnMapping[] = preview.headers.map(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Smart field matching
        let suggestedField = '';
        if (normalizedHeader.includes('name') || normalizedHeader.includes('company') || normalizedHeader.includes('plant')) {
          suggestedField = 'name';
        } else if (normalizedHeader.includes('contact') && (normalizedHeader.includes('person') || normalizedHeader.includes('name'))) {
          suggestedField = 'contact_person';
        } else if (normalizedHeader.includes('title')) {
          suggestedField = 'contact_title';
        } else if (normalizedHeader.includes('email')) {
          suggestedField = 'email';
        } else if (normalizedHeader.includes('phone') && !normalizedHeader.includes('secondary')) {
          suggestedField = 'phone';
        } else if (normalizedHeader.includes('phone') && normalizedHeader.includes('secondary')) {
          suggestedField = 'secondary_phone';
        } else if (normalizedHeader.includes('address')) {
          suggestedField = 'address';
        } else if (normalizedHeader.includes('city')) {
          suggestedField = 'city';
        } else if (normalizedHeader.includes('state')) {
          suggestedField = 'state';
        } else if (normalizedHeader.includes('zip') || normalizedHeader.includes('postal')) {
          suggestedField = 'zip';
        } else if (normalizedHeader.includes('note') || normalizedHeader.includes('desc')) {
          suggestedField = 'notes';
        } else if (normalizedHeader.includes('type') || normalizedHeader.includes('industry')) {
          suggestedField = 'type';
        } else if (normalizedHeader.includes('status')) {
          suggestedField = 'lead_status';
        }

        return {
          csvColumn: header,
          leadField: suggestedField
        };
      });

      setColumnMappings(initialMappings);
      setCurrentStep('mapping');

    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      setFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const updateMapping = (csvColumn: string, leadField: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, leadField }
          : mapping
      )
    );
  };

  const validateMappings = (): string[] => {
    const errors: string[] = [];
    const requiredFields = leadFields.filter(f => f.required).map(f => f.field);
    const mappedFields = columnMappings.filter(m => m.leadField).map(m => m.leadField);
    
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    if (missingRequired.length > 0) {
      errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
    }

    return errors;
  };

  const handleImport = async () => {
    if (!file || !selectedUser) {
      setError('Please select a file and user');
      return;
    }

    const validationErrors = validateMappings();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/import/leads/generic`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || 'Import failed');
        } else {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }

      const data = await res.json();
      setImportResult(data);
      setCurrentStep('import');
      
      // Reset form
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

  const resetImport = () => {
    setCurrentStep('upload');
    setFile(null);
    setPreviewData(null);
    setColumnMappings([]);
    setImportResult(null);
    setError('');
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/import/leads/generic-template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to download template');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lead_import_template_generic.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Lead Importer
        </h3>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-blue-600 font-medium' : currentStep === 'mapping' || currentStep === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'upload' ? 'bg-blue-100' : currentStep === 'mapping' || currentStep === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
            1
          </div>
          Upload File
        </div>
        <ArrowRight className="text-gray-300" size={20} />
        <div className={`flex items-center gap-2 ${currentStep === 'mapping' ? 'text-blue-600 font-medium' : currentStep === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'mapping' ? 'bg-blue-100' : currentStep === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
            2
          </div>
          Map Fields
        </div>
        <ArrowRight className="text-gray-300" size={20} />
        <div className={`flex items-center gap-2 ${currentStep === 'import' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'import' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            3
          </div>
          Import Data
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload a CSV or Excel file with lead data</li>
          <li>• <strong>Required field:</strong> Company/Organization name</li>
          <li>• <strong>Optional fields:</strong> Contact person, email, phone, address, notes, business type, etc.</li>
          <li>• You'll be able to map your column names to our lead fields</li>
          <li>• All leads will be assigned to the selected user</li>
          <li>• Incomplete records will be imported with available data</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Step 1: Upload File */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {/* User Selection */}
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
                <option key={user.id} value={user.email}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
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

      {/* Step 2: Field Mapping */}
      {currentStep === 'mapping' && previewData && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-900 mb-2">File Processed Successfully!</h4>
            <p className="text-sm text-green-800">
              Found {previewData.totalRows} rows with {previewData.headers.length} columns. 
              Please map your columns to our lead fields below.
            </p>
          </div>

          {/* Field Mapping Interface */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Map Your Columns to Lead Fields</h4>
            <div className="space-y-3">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{mapping.csvColumn}</div>
                    <div className="text-xs text-gray-500">
                      Sample: {previewData.rows[0]?.[index] || 'No data'}
                    </div>
                  </div>
                  <ArrowRight className="text-gray-400" size={16} />
                  <div className="flex-1">
                    <select
                      value={mapping.leadField}
                      onChange={(e) => updateMapping(mapping.csvColumn, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Skip this column</option>
                      {leadFields.map(field => (
                        <option key={field.field} value={field.field}>
                          {field.field} {field.required && '(Required)'} - {field.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Data Preview</h4>
              <button
                onClick={() => setShowAllPreview(!showAllPreview)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showAllPreview ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnMappings.map((mapping, index) => (
                        <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          <div>{mapping.csvColumn}</div>
                          {mapping.leadField && (
                            <div className="text-blue-600 font-normal">→ {mapping.leadField}</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {previewData.rows.slice(0, showAllPreview ? previewData.rows.length : 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                            {cell || <span className="text-gray-400 italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {!showAllPreview && previewData.rows.length > 3 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                ... and {previewData.rows.length - 3} more rows
              </div>
            )}
          </div>

          {/* Required Fields Check */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Required Fields</h4>
            <div className="text-sm text-yellow-800">
              {leadFields.filter(f => f.required).map(field => {
                const isMapped = columnMappings.some(m => m.leadField === field.field);
                return (
                  <div key={field.field} className={`flex items-center gap-2 ${isMapped ? 'text-green-700' : 'text-red-700'}`}>
                    <span>{isMapped ? '✓' : '✗'}</span>
                    <span>{field.field}: {field.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={resetImport}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={() => setCurrentStep('import')}
              disabled={validateMappings().length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Import
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Import */}
      {currentStep === 'import' && (
        <div className="space-y-6">
          {!importResult && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Ready to Import</h4>
                <p className="text-sm text-blue-800">
                  File: {file?.name}<br/>
                  Assigned to: {selectedUser}<br/>
                  Mapped fields: {columnMappings.filter(m => m.leadField).length} of {columnMappings.length} columns
                </p>
              </div>

              <button
                onClick={handleImport}
                disabled={isUploading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {previewData?.totalRows} Leads
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentStep('mapping')}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back to Mapping
              </button>
            </>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-green-900">Import Completed</h4>
                </div>
                <p className="text-green-800 mb-2">{importResult.message}</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✅ Successfully imported: {importResult.successful_imports} leads</p>
                  {importResult.failed_imports > 0 && (
                    <p>❌ Failed imports: {importResult.failed_imports}</p>
                  )}
                  {importResult.warnings && importResult.warnings.length > 0 && (
                    <p>⚠️ Warnings: {importResult.warnings.length}</p>
                  )}
                </div>
              </div>

              {/* Show warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h5 className="font-medium text-yellow-900 mb-2">Import Warnings</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show failures if any */}
              {importResult.failures && importResult.failures.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h5 className="font-medium text-red-900 mb-2">Failed Imports</h5>
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Failures Modal */}
      {showModal && importResult?.failures && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-hidden">
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
                      Row {failure.row}: {failure.data?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-red-700">{failure.error}</p>
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Show data</summary>
                      <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(failure.data, null, 2)}
                      </pre>
                    </details>
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