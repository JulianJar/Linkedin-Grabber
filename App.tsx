import React, { useState, useEffect } from 'react';
import { ExtractionForm } from './components/ExtractionForm';
import { LeadEditor } from './components/LeadEditor';
import { HistoryList } from './components/HistoryList';
import { Settings } from './components/Settings';
import { DailyProgress } from './components/DailyProgress';
import { MessagingAssistant } from './components/MessagingAssistant';
import { Lead, ExtractedData, UserSettings } from './types';
import { copyLeadToClipboard } from './utils/clipboardHelper';
import { saveToGoogleSheet } from './services/googleSheetService';
import { scrapeLinkedInProfile } from './utils/scraper';
import { Sheet, Download, Info, Check, AlertTriangle, Settings as SettingsIcon, MessageSquare, MousePointerClick } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_PROMPTS } from './services/openaiService';

type Tab = 'extractor' | 'messaging';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('extractor');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 1. Persistence for Work In Progress (currentLead)
  const [currentLead, setCurrentLead] = useState<(Partial<Lead> & Partial<ExtractedData>) | null>(() => {
    const savedWork = localStorage.getItem('linkclipper_current_work');
    return savedWork ? JSON.parse(savedWork) : null;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('linkclipper_leads');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
      const saved = localStorage.getItem('linkclipper_settings');
      const defaultSettings: UserSettings = { 
          googleScriptUrl: '', 
          openaiApiKey: '',
          openaiModel: 'gpt-4o-mini',
          myTargetAudience: '',
          myValueProposition: '',
          customPrompts: {
              commonGround: DEFAULT_PROMPTS.commonGround,
              industryConnection: DEFAULT_PROMPTS.industryConnection,
              engagementHook: DEFAULT_PROMPTS.engagementHook
          }
      };
      
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return { 
                  ...defaultSettings, 
                  ...parsed,
                  customPrompts: { ...defaultSettings.customPrompts, ...(parsed.customPrompts || {}) }
              };
          } catch (e) {
              return defaultSettings;
          }
      }
      return defaultSettings;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const DAILY_TARGET = 30;

  // Derived State for Daily Progress and Filtering
  const today = new Date().toLocaleDateString();
  const todaysLeads = leads.filter(l => l.date === today);
  const dailyCount = todaysLeads.length;

  useEffect(() => {
    localStorage.setItem('linkclipper_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    if (currentLead) {
        localStorage.setItem('linkclipper_current_work', JSON.stringify(currentLead));
    } else {
        localStorage.removeItem('linkclipper_current_work');
    }
  }, [currentLead]);

  useEffect(() => {
    localStorage.setItem('linkclipper_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setError('');

    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
      try {
        // @ts-ignore
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab?.id) {
            // @ts-ignore
            const [lastTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (!lastTab?.id) throw new Error("No active LinkedIn tab found.");
            // @ts-ignore
            chrome.scripting.executeScript({
                target: { tabId: lastTab.id },
                func: scrapeLinkedInProfile,
            }).then((results: any) => processResults(results));
            return;
        }

        // @ts-ignore
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapeLinkedInProfile,
        });

        processResults(results);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to communicate with the page.");
        setIsLoading(false);
      }
    } else {
      // Dev mode
      setTimeout(() => {
        const mockData = {
            firstName: "Dev",
            lastName: "User",
            title: "Vice President of Sales",
            company: "TechCorp",
            companyLinkedin: "https://linkedin.com/company/techcorp",
            lastPostContent: "Excited to share our Q3 results!",
            linkedinUrl: "https://linkedin.com/in/dev-user",
            date: new Date().toLocaleDateString(),
            email: '',
            website: '',
            connectionSent: 'Yes',
            accepted: 'Pending',
            whatOffer: '',
            connectionMessageType: 'Blank Request',
            additionalNotes: ''
        };
        setCurrentLead(mockData);
        setIsLoading(false);
      }, 500);
    }
  };

  const processResults = (results: any) => {
    if (results && results[0] && results[0].result) {
        const data = results[0].result; 
        
        if (!data.firstName && !data.title) {
             setError("Profile data empty. Please ensure the profile is fully loaded.");
             setIsLoading(false);
             return;
        }

        setCurrentLead({
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            company: data.company,
            companyLinkedin: data.companyLinkedin,
            lastPostContent: data.lastPostContent,
            linkedinUrl: data.url, 
            date: new Date().toLocaleDateString(),
            email: '',
            website: '',
            connectionSent: 'Yes',
            accepted: 'Pending',
            whatOffer: '',
            connectionMessageType: 'Blank Request',
            additionalNotes: ''
        });
    } else {
        setError("Could not find profile data.");
    }
    setIsLoading(false);
  };

  const handleSaveLead = async (lead: Lead) => {
    const newLead = { ...lead, id: crypto.randomUUID() };
    setIsSaving(true);
    
    try {
        await copyLeadToClipboard(newLead);
        let message = "Copied to clipboard!";
        if (settings.googleScriptUrl) {
            await saveToGoogleSheet(newLead, settings.googleScriptUrl);
            message = "Saved to Sheet & Copied!";
        }
        setLeads(prev => [newLead, ...prev]);
        setCurrentLead(null);
        
        // Calculate new daily count for confetti
        const newDailyCount = dailyCount + 1;
        if (newDailyCount === DAILY_TARGET) {
           confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 } });
        } else {
           confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        showNotification(message);
    } catch (err: any) {
        console.error(err);
        if (settings.googleScriptUrl) {
            showNotification("Copied, but failed to save to Sheet.", "error");
            setLeads(prev => [newLead, ...prev]);
            setCurrentLead(null);
        } else {
             alert("Could not copy to clipboard.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteLead = (id: string) => {
    if(confirm("Delete this lead from history?")) {
        setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleDownloadCSV = () => {
    if (leads.length === 0) return;
    // Updated Headers to match sheet Columns A-N
    const headers = [
        "Date", 
        "First Name", 
        "Last Name", 
        "Headline", 
        "Email", 
        "Company", 
        "Website", 
        "LinkedIn", 
        "Company LinkedIn", 
        "Connection Message Type", 
        "Connection Sent?", 
        "Accepted?", 
        "Additional Info", 
        "What Offer?"
    ];
    
    const csvContent = [
        headers.join(","), 
        ...leads.map(l => [
            l.date, 
            l.firstName, 
            l.lastName, 
            l.title, 
            l.email, 
            l.company, 
            l.website, 
            l.linkedinUrl, 
            l.companyLinkedin, 
            l.connectionMessageType, 
            l.connectionSent, 
            l.accepted,
            l.additionalNotes,
            l.whatOffer
        ].map(f => `"${(f || '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `linkedin_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans min-h-screen">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-linkedin-600 p-1.5 rounded-lg text-white">
                <Sheet className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-gray-800">ROYA LeadGrab</h1>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-gray-100 text-linkedin-600' : 'text-gray-500 hover:text-linkedin-600 hover:bg-gray-100'}`}
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  disabled={leads.length === 0}
                  className="p-2 text-gray-500 hover:text-linkedin-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {!showSettings && (
          <div className="flex border-t border-gray-100">
             <button
                onClick={() => setActiveTab('extractor')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'extractor' ? 'border-linkedin-600 text-linkedin-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <MousePointerClick className="w-4 h-4" /> Lead Extractor
             </button>
             <button
                onClick={() => setActiveTab('messaging')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'messaging' ? 'border-linkedin-600 text-linkedin-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <MessageSquare className="w-4 h-4" /> Messaging
             </button>
          </div>
        )}
      </nav>

      <main>
        {showSettings ? (
            <div className="p-4">
                <Settings 
                    settings={settings} 
                    onSave={handleSaveSettings} 
                    onClose={() => setShowSettings(false)} 
                />
            </div>
        ) : (
            <>
                {/* --- EXTRACTOR TAB --- */}
                {activeTab === 'extractor' && (
                    <div className="p-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {!currentLead && (
                            <DailyProgress count={dailyCount} target={DAILY_TARGET} />
                        )}

                        {!currentLead && !settings.googleScriptUrl && (
                            <div className="bg-blue-50 border border-blue-100 p-3 mb-4 rounded-lg flex gap-3 items-start">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                To save directly to your Google Sheet, click the <strong>Settings</strong> icon.
                            </p>
                        </div>
                        )}

                        {!currentLead ? (
                            <ExtractionForm onExtract={handleExtract} isLoading={isLoading} error={error} />
                        ) : (
                            <LeadEditor 
                                initialData={currentLead}
                                userSettings={settings}
                                onSave={handleSaveLead} 
                                onCancel={() => setCurrentLead(null)} 
                                isSaving={isSaving}
                                hasSheetConnection={!!settings.googleScriptUrl}
                            />
                        )}

                        <HistoryList leads={todaysLeads} onDelete={handleDeleteLead} />
                    </div>
                )}

                {/* --- MESSAGING TAB --- */}
                {activeTab === 'messaging' && (
                    <MessagingAssistant currentLead={currentLead} />
                )}
            </>
        )}
      </main>

      {showToast && (
        <div className={`fixed bottom-4 left-4 right-4 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50 ${showToast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
            <div className={`${showToast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} rounded-full p-1`}>
                {showToast.type === 'error' ? <AlertTriangle className="w-3 h-3 text-white" /> : <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm font-medium">{showToast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;