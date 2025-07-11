import { Database } from 'lucide-react';
import LeadImporter from '@/components/ui/LeadImporter';

export default function AdminImportPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="h-8 w-8" />
          Data Import
        </h1>
        <p className="mt-2 text-gray-600">
          Import leads and other data into the CRM system using our flexible importer.
        </p>
      </div>

      {/* Enhanced Import Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Flexible Lead Importer</h3>
        <p className="text-sm text-blue-800">
          Our enhanced importer can handle CSV or Excel files from any source - perfect for AI-generated leads 
          or data with varying completeness. You can map your column names to our lead fields, and missing 
          information will be handled gracefully.
        </p>
      </div>

      {/* Lead Import Section */}
      <div className="mb-8">
        <LeadImporter />
      </div>

      {/* Future import sections can be added here */}
      {/* 
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Import</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Client import feature coming soon...</p>
        </div>
      </div>
      */}
    </div>
  );
}