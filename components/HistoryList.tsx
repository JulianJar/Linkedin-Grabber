import React from 'react';
import { Lead } from '../types';
import { ExternalLink, Clipboard, Trash2 } from 'lucide-react';
import { copyLeadToClipboard } from '../utils/clipboardHelper';

interface HistoryListProps {
  leads: Lead[];
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ leads, onDelete }) => {
  if (leads.length === 0) {
    return (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <p>No leads captured today.</p>
        </div>
    )
  }

  const handleCopy = async (lead: Lead) => {
    await copyLeadToClipboard(lead);
    alert("Row copied to clipboard!");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">Today's Captures</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{leads.length} leads</span>
        </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors group">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-medium text-gray-900 truncate">{lead.firstName} {lead.lastName}</h4>
                <p className="text-sm text-gray-600 truncate">{lead.title}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-1">
                   <span>{lead.date}</span>
                   {lead.whatOffer && <span>• {lead.whatOffer}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                 {lead.linkedinUrl && (
                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Open LinkedIn">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                 )}
                 <button onClick={() => handleCopy(lead)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Copy Row again">
                    <Clipboard className="w-4 h-4" />
                 </button>
                 <button onClick={() => onDelete(lead.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};