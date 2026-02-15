import React, { useState, useEffect } from 'react';
import { Save, Copy, X, Loader2, Sheet, Sparkles, AlertTriangle, Eraser } from 'lucide-react';
import { Lead, ExtractedData, UserSettings } from '../types';
import { generateConnectionMessage } from '../services/openaiService';

interface LeadEditorProps {
  initialData: Partial<Lead> & Partial<ExtractedData>;
  userSettings: UserSettings;
  onSave: (lead: Lead) => void;
  onCancel: () => void;
  isSaving: boolean;
  hasSheetConnection: boolean;
}

export const LeadEditor: React.FC<LeadEditorProps> = ({ initialData, userSettings, onSave, onCancel, isSaving, hasSheetConnection }) => {
  const [formData, setFormData] = useState<Lead>({
    id: '',
    date: new Date().toLocaleDateString(),
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    website: '',
    companyLinkedin: '',
    linkedinUrl: '',
    whatOffer: '',
    connectionMessageType: 'Blank Request',
    generatedMessage: '',
    connectionSent: 'Yes',
    accepted: 'Pending',
    additionalNotes: ''
  });

  const [aiContext, setAiContext] = useState('');
  // New state to hold post content (scraped or manually entered)
  const [postContent, setPostContent] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ 
          ...prev, 
          ...initialData,
          company: initialData.company || prev.company,
          companyLinkedin: initialData.companyLinkedin || prev.companyLinkedin
        }));
      if (initialData.lastPostContent) {
          setPostContent(initialData.lastPostContent);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'connectionMessageType') {
       // Reset generated message and error when switching templates
       // We keep postContent as it might be useful if they switch back
       setFormData(prev => ({ 
         ...prev, 
         [name]: value,
         generatedMessage: '' 
       }));
       setGenerationError('');
       // Optional: We could clear aiContext here too, but some users might want to keep "Keep it under 200 chars" etc.
       // Given the placeholders are very different, clearing it is probably safer to avoid confusion.
       setAiContext('');
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGenerateMessage = async () => {
      if (formData.connectionMessageType === 'Blank Request') {
          setFormData(prev => ({...prev, generatedMessage: ''}));
          return;
      }

      setIsGenerating(true);
      setGenerationError('');
      
      try {
        const message = await generateConnectionMessage(
            formData.connectionMessageType,
            {
                firstName: formData.firstName,
                title: formData.title,
                company: formData.company,
                lastPostContent: postContent // Use local state which might be edited
            },
            userSettings,
            aiContext
        );
        // This overwrites any existing message
        setFormData(prev => ({...prev, generatedMessage: message}));
      } catch (err: any) {
          setGenerationError(err.message || "Failed to generate");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getContextPlaceholder = () => {
      switch (formData.connectionMessageType) {
          case "The Common Ground Approach":
              return "Optional: Shared alumni? Mutual connection? Event you both attended? (e.g., 'We both know John Doe')";
          case "The Industry Connection":
              return "Optional: Specific industry trend or observation? (e.g., 'Mention the new compliance laws')";
          case "The Engagement Hook":
              return "Optional: Specific focus on their post? (e.g., 'Agree with their point about remote work')";
          default:
              return "Optional: Add specific instructions for the AI...";
      }
  };

  if (!initialData) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-linkedin-100 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Review & Save Lead</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" disabled={isSaving}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        {/* Row 1: Name */}
        <div className="grid grid-cols-2 gap-3">
           <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">First Name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm focus:ring-1 focus:ring-linkedin-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm focus:ring-1 focus:ring-linkedin-500"
            />
          </div>
        </div>

        {/* Row 2: Title */}
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Headline</label>
            <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
            />
        </div>

        {/* Row 3: Company & Company LI */}
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                />
            </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company LinkedIn</label>
                <input
                name="companyLinkedin"
                value={formData.companyLinkedin}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm text-xs"
                />
            </div>
        </div>
        
        {/* Row 4: Email & Website */}
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="unknown"
                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Website</label>
                <input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="www..."
                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                />
            </div>
        </div>

        {/* Row 5: AI Message Generator */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
             <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Message Generator
                </label>
                <a href={formData.linkedinUrl} target="_blank" className="text-[10px] text-purple-600 underline">Open Profile</a>
             </div>
             
             <select
              name="connectionMessageType"
              value={formData.connectionMessageType}
              onChange={handleChange}
              className="w-full p-2 border border-purple-200 rounded mb-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="Blank Request">Blank Request (No Message)</option>
                <option value="The Common Ground Approach">The Common Ground Approach</option>
                <option value="The Industry Connection">The Industry Connection</option>
                <option value="The Engagement Hook">The Engagement Hook (Needs Post)</option>
            </select>

            {formData.connectionMessageType !== 'Blank Request' && (
                <>
                    {/* Explicit Post Content Field for Engagement Hook */}
                    {formData.connectionMessageType === 'The Engagement Hook' && (
                        <div className="mb-3 animate-in fade-in slide-in-from-top-1">
                             <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Recent Post Content
                                </label>
                                <div className="flex items-center gap-2">
                                    {!postContent && (
                                        <span className="text-[10px] text-red-500 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Not found automatically
                                        </span>
                                    )}
                                    {postContent && (
                                        <button 
                                            type="button" 
                                            onClick={() => setPostContent('')}
                                            className="text-[10px] text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                                            title="Clear content to paste new text"
                                        >
                                            <Eraser className="w-3 h-3" /> Clear
                                        </button>
                                    )}
                                </div>
                             </div>
                             <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                rows={2}
                                placeholder="Paste the specific post text you want to reference here..."
                                className="w-full p-2 border border-orange-200 bg-orange-50/50 rounded text-xs focus:ring-1 focus:ring-orange-400 placeholder:text-gray-400"
                            />
                        </div>
                    )}

                    {/* Additional Context Input */}
                    <div className="mb-3">
                        <textarea
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            rows={2}
                            placeholder={getContextPlaceholder()}
                            className="w-full p-2 border border-purple-200 rounded text-xs bg-white focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Result Output (Hidden until generated) */}
                    {(formData.generatedMessage || isGenerating) && (
                        <div className="relative animate-in fade-in slide-in-from-top-2">
                            <textarea
                                name="generatedMessage"
                                value={formData.generatedMessage}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Generated message will appear here..."
                                className="w-full p-2 border border-purple-200 rounded text-sm mb-2"
                            />
                            <div className="absolute bottom-4 right-2 text-[10px] text-gray-400">
                                {formData.generatedMessage.length}/300
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                         <div className="text-xs text-red-500 max-w-[180px] leading-tight">{generationError}</div>
                         <div className="flex gap-2">
                            {formData.generatedMessage && (
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(formData.generatedMessage)}
                                    className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded text-xs font-medium hover:bg-purple-50"
                                >
                                    Copy Text
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleGenerateMessage}
                                disabled={isGenerating || !userSettings.openaiApiKey}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                {formData.generatedMessage ? 'Regenerate' : 'Generate'}
                            </button>
                         </div>
                    </div>
                </>
            )}
        </div>

        {/* Row 6: Offer & Status */}
        <div className="grid grid-cols-3 gap-3">
           <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">What Offer?</label>
            <input
              name="whatOffer"
              value={formData.whatOffer}
              onChange={handleChange}
              placeholder="e.g. Audit"
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
            />
          </div>
            <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sent?</label>
                 <select
                  name="connectionSent"
                  value={formData.connectionSent}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
             <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Accepted?</label>
                 <select
                  name="accepted"
                  value={formData.accepted}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
        </div>

        {/* Row 7: Additional Info */}
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Additional Info</label>
            <input
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any extra details..."
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
            />
        </div>

        <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md ${
                  hasSheetConnection 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-linkedin-600 hover:bg-linkedin-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending to Sheet...
                </>
              ) : hasSheetConnection ? (
                <>
                    <Sheet className="w-5 h-5" />
                    Save Lead
                </>
              ) : (
                <>
                    <Copy className="w-5 h-5" />
                    Copy Lead
                </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
};