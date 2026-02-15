import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle2, User, Building2, MessageSquare, ChevronDown } from 'lucide-react';
import { MESSAGE_TEMPLATES, MessageTemplate } from '../data/templates';
import { Lead } from '../types';

interface MessagingAssistantProps {
  currentLead: Partial<Lead> | null;
}

export const MessagingAssistant: React.FC<MessagingAssistantProps> = ({ currentLead }) => {
  const [activeCategory, setActiveCategory] = useState<MessageTemplate['category']>('firstMessage');
  const [inputs, setInputs] = useState({
    firstName: '',
    company: '',
    topic: '',
    role: '',
    industry: ''
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-fill from current lead when available
  useEffect(() => {
    if (currentLead) {
      setInputs(prev => ({
        ...prev,
        firstName: currentLead.firstName || prev.firstName,
        company: currentLead.company || prev.company,
        role: currentLead.title || prev.role,
      }));
    }
  }, [currentLead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const processTemplate = (content: string) => {
    let processed = content;
    // Replace standard keys
    processed = processed.replace(/{firstName}/g, inputs.firstName || '[First Name]');
    processed = processed.replace(/{company}/g, inputs.company || '[Company]');
    processed = processed.replace(/{topic}/g, inputs.topic || '[Topic]');
    processed = processed.replace(/{role}/g, inputs.role || '[Role]');
    processed = processed.replace(/{industry}/g, inputs.industry || '[Industry]');
    
    // Highlight remaining placeholders for the user (optional visual cue logic could go here)
    return processed;
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const filteredTemplates = MESSAGE_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="bg-gray-50 min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Input Variables Section */}
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3 h-3" />
            Dynamic Variables
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
                <input
                    name="firstName"
                    value={inputs.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-linkedin-500 bg-gray-50"
                />
            </div>
            <div>
                <input
                    name="company"
                    value={inputs.company}
                    onChange={handleChange}
                    placeholder="Company"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-linkedin-500 bg-gray-50"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
             <div>
                <input
                    name="topic"
                    value={inputs.topic}
                    onChange={handleChange}
                    placeholder="Topic / Post Context"
                    className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-linkedin-500"
                />
            </div>
            <div>
                <input
                    name="industry"
                    value={inputs.industry}
                    onChange={handleChange}
                    placeholder="Industry"
                    className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-linkedin-500"
                />
            </div>
        </div>
      </div>

      <div className="p-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
                onClick={() => setActiveCategory('connection')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'connection' ? 'bg-linkedin-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                Connection (Day 0)
            </button>
            <button
                onClick={() => setActiveCategory('firstMessage')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'firstMessage' ? 'bg-linkedin-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                First Message (Day 1)
            </button>
            <button
                onClick={() => setActiveCategory('value')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'value' ? 'bg-linkedin-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                Value / Offer
            </button>
             <button
                onClick={() => setActiveCategory('followUp')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'followUp' ? 'bg-linkedin-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                Campaigns
            </button>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
            {filteredTemplates.map(template => {
                const processedContent = processTemplate(template.content);
                
                return (
                    <div key={template.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">{template.title}</h4>
                                {template.stats && (
                                    <span className="inline-block bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-medium mt-1">
                                        {template.stats}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleCopy(processedContent, template.id)}
                                className={`p-2 rounded-lg transition-colors ${copiedId === template.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-linkedin-50 hover:text-linkedin-600'}`}
                                title="Copy to clipboard"
                            >
                                {copiedId === template.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        <div className="relative bg-gray-50 rounded p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed border border-gray-100">
                             {processedContent || <span className="text-gray-400 italic">(Blank Invite)</span>}
                        </div>

                        {template.description && (
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {template.description}
                            </p>
                        )}
                    </div>
                );
            })}
            
            {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    No templates found for this category.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};