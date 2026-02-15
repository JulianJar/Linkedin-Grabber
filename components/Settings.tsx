import React, { useState } from 'react';
import { Save, ChevronDown, ChevronUp, Copy, CheckCircle2, Key, Target, Sparkles, AlertCircle, Edit2, X, Cpu, MessageSquare } from 'lucide-react';
import { generateScriptCode } from '../services/googleSheetService';
import { UserSettings } from '../types';
import { DEFAULT_PROMPTS } from '../services/openaiService';

interface SettingsProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

type Tab = 'general' | 'templates';

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  
  // We separate the API key logic to ensure it's "write-only" in the UI
  const [formData, setFormData] = useState<Omit<UserSettings, 'openaiApiKey'>>({
      googleScriptUrl: settings.googleScriptUrl,
      openaiModel: settings.openaiModel || 'gpt-4o-mini',
      myTargetAudience: settings.myTargetAudience,
      myValueProposition: settings.myValueProposition,
      customPrompts: settings.customPrompts || {
          commonGround: DEFAULT_PROMPTS.commonGround,
          industryConnection: DEFAULT_PROMPTS.industryConnection,
          engagementHook: DEFAULT_PROMPTS.engagementHook
      }
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(!settings.openaiApiKey);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          customPrompts: {
              ...prev.customPrompts,
              [name]: value
          }
      }));
  };

  const resetPrompts = () => {
      if(confirm("Reset all templates to default?")) {
        setFormData(prev => ({
            ...prev,
            customPrompts: {
                commonGround: DEFAULT_PROMPTS.commonGround,
                industryConnection: DEFAULT_PROMPTS.industryConnection,
                engagementHook: DEFAULT_PROMPTS.engagementHook
            }
        }));
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalApiKey = isEditingKey ? apiKeyInput.trim() : settings.openaiApiKey;
    const finalSettings: UserSettings = {
        ...formData,
        openaiApiKey: finalApiKey
    };
    onSave(finalSettings);
    onClose();
  };

  const copyCode = () => {
    const code = generateScriptCode("");
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6 animate-in fade-in zoom-in-95 duration-200 h-[550px] flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
          <Key className="w-5 h-5 text-linkedin-600" />
          Settings
      </h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-linkedin-600 text-linkedin-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              General & AI
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-linkedin-600 text-linkedin-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Prompt Templates
          </button>
      </div>
      
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1">
        
        {activeTab === 'general' && (
            <div className="space-y-6">
                {/* OpenAI Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        AI Configuration
                    </h3>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">OpenAI API Key</label>
                        {!isEditingKey ? (
                            <div className="flex items-center justify-between p-2.5 border border-green-200 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold">Key Securely Saved</span>
                                        <span className="text-[10px] opacity-75">sk-••••••••••••••••</span>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditingKey(true); setApiKeyInput(''); }}
                                    className="flex items-center gap-1 text-xs bg-white border border-green-200 text-green-700 px-2 py-1 rounded shadow-sm hover:bg-green-50"
                                >
                                    <Edit2 className="w-3 h-3" /> Change
                                </button>
                            </div>
                        ) : (
                            <div className="relative animate-in fade-in slide-in-from-top-1">
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder={settings.openaiApiKey ? "Enter new key to overwrite..." : "sk-..."}
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16"
                                />
                                {settings.openaiApiKey && (
                                    <button 
                                        type="button" onClick={() => setIsEditingKey(false)}
                                        className="absolute right-2 top-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"
                                    >
                                        <X className="w-3 h-3" /> Cancel
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            {isEditingKey && <AlertCircle className="w-3 h-3" />}
                            {isEditingKey ? "Key stored locally in browser." : "Key is hidden."}
                        </p>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Cpu className="w-3 h-3" /> Model Selection
                        </label>
                        <select
                            name="openaiModel"
                            value={formData.openaiModel}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                            <option value="gpt-4o">GPT-4o (Best Quality)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">My Target Audience</label>
                        <input
                            type="text"
                            name="myTargetAudience"
                            value={formData.myTargetAudience}
                            onChange={handleChange}
                            placeholder="e.g. SaaS Sales Leaders"
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">My Value Proposition</label>
                        <textarea
                            name="myValueProposition"
                            value={formData.myValueProposition}
                            onChange={handleChange}
                            rows={2}
                            placeholder="e.g. build predictable pipelines"
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Google Sheet Section */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Apps Script URL</label>
                <input
                    type="url"
                    name="googleScriptUrl"
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-linkedin-500 focus:outline-none text-sm"
                    value={formData.googleScriptUrl}
                    onChange={handleChange}
                />
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                    >
                        <span>Google Sheet Setup Instructions</span>
                        {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showInstructions && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 space-y-3">
                        <ol className="list-decimal pl-4 space-y-2 text-xs">
                            <li>Extensions &gt; Apps Script. Paste code below.</li>
                            <li>Deploy &gt; Web app. Access: <strong>Anyone</strong>.</li>
                        </ol>
                        <div className="mt-2 relative group">
                            <pre className="bg-gray-800 text-gray-100 p-2 rounded text-[10px] overflow-x-auto font-mono h-20">{generateScriptCode("")}</pre>
                            <button
                            type="button" onClick={copyCode}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white backdrop-blur-sm transition-colors"
                            >
                            {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'templates' && (
            <div className="space-y-6">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
                    <p className="font-semibold mb-1">Available Variables:</p>
                    <p className="font-mono text-[10px] space-x-1">
                        <span className="bg-blue-100 px-1 rounded">{'{{firstName}}'}</span>
                        <span className="bg-blue-100 px-1 rounded">{'{{title}}'}</span>
                        <span className="bg-blue-100 px-1 rounded">{'{{company}}'}</span>
                        <span className="bg-blue-100 px-1 rounded">{'{{myTargetAudience}}'}</span>
                        <span className="bg-blue-100 px-1 rounded">{'{{myValueProposition}}'}</span>
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Common Ground Template</label>
                    <textarea
                        name="commonGround"
                        value={formData.customPrompts.commonGround}
                        onChange={handlePromptChange}
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-linkedin-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Industry Connection Template</label>
                    <textarea
                        name="industryConnection"
                        value={formData.customPrompts.industryConnection}
                        onChange={handlePromptChange}
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-linkedin-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Engagement Hook Template</label>
                    <textarea
                        name="engagementHook"
                        value={formData.customPrompts.engagementHook}
                        onChange={handlePromptChange}
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-linkedin-500"
                    />
                </div>

                <button 
                    type="button" 
                    onClick={resetPrompts}
                    className="text-xs text-red-500 underline hover:text-red-700"
                >
                    Restore Default Templates
                </button>
            </div>
        )}

        <div className="sticky bottom-0 bg-white pt-4 pb-0 mt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-linkedin-600 hover:bg-linkedin-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};