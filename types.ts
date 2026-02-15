export interface Lead {
  id: string;
  // Sheet Columns:
  date: string;              // Current Date
  firstName: string;         // First Name
  lastName: string;          // Last Name
  title: string;             // Title
  email: string;             // Email
  company: string;           // Company
  website: string;           // Website
  linkedinUrl: string;       // LinkedIn (Profile URL)
  companyLinkedin: string;   // Company LinkedIn
  whatOffer: string;         // What Offer?
  connectionSent: string;    // Connection Sent?
  accepted: string;          // Accepted?
  
  // App internal / Extra
  connectionMessageType: string; 
  generatedMessage: string; 
  additionalNotes: string; // Kept in UI, but maybe not in main sheet columns unless requested
}

export interface ExtractedData {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companyLinkedin: string;
  lastPostContent: string; 
}

export interface PromptTemplates {
  commonGround: string;
  industryConnection: string;
  engagementHook: string;
}

export interface UserSettings {
  googleScriptUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  myTargetAudience: string;
  myValueProposition: string;
  customPrompts: PromptTemplates;
}