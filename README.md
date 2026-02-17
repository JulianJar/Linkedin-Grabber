# ROYA LinkedIn LeadGrab 🚀

**IMPORTANT: it might initially take a few seconds to load the extension**

A powerful Chrome Extension built with React, TypeScript, and Vite designed to streamline LinkedIn prospecting. It allows you to extract profile data, generate AI-powered connection requests, manage messaging templates, and sync leads directly to Google Sheets.

## ✨ Features

*   **1-Click Lead Extraction:** Instantly scrape Name, Headline, Company, Location, and Recent Post content from any LinkedIn profile.
*   **AI Message Generator:** Uses OpenAI (GPT-4o/Mini) to write personalized connection requests based on the prospect's profile and your value proposition.
*   **Messaging Assistant:** A dedicated side panel tab with battle-tested templates (Connection, First Message, Value Offers) and reply-rate statistics.
*   **Google Sheets Sync:** Save leads directly to your Google Sheet without third-party tools (Zapier, Make, etc.).
*   **Daily Progress Tracker:** Set daily goals (default: 30) and track your outreach momentum.
*   **CSV Export:** Download your daily captures as a CSV file.

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **Build Tool:** Vite
*   **Extension API:** Chrome Manifest V3 (Side Panel API, Scripting API)
*   **AI:** OpenAI API
*   **Database:** Google Sheets (via Apps Script)

## 🚀 Setup & Installation

### 1. Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/roya-linkedin-leadgrab.git
cd roya-linkedin-leadgrab
npm install
```

### 3. Build the Extension
To use this in Chrome, you must build the project first. This generates a `dist` folder with the static assets.

```bash
npm run build
```

### 4. Load into Google Chrome
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle switch in the top right corner).
3.  Click the **Load unpacked** button.
4.  Select the `dist` folder created in the previous step.
5.  Pin the ROYA extension icon to your toolbar for easy access.

---

## ⚙️ Configuration

To unlock the full power of the extension, you need to configure the Settings panel (click the Gear icon inside the app).

### 1. OpenAI API (Optional but Recommended)
For AI message generation to work:
1.  Get an API Key from [platform.openai.com](https://platform.openai.com/api-keys).
2.  Paste it into the **OpenAI API Key** field in the extension settings.
3.  The key is stored locally in your browser for security.

### 2. Google Sheets Integration (Free Database)
To save leads to a Google Sheet:

1.  Create a new **Google Sheet**.
2.  Go to **Extensions** > **Apps Script**.
3.  Paste the code provided below (or copy it from the Extension's Settings panel > "Google Sheet Setup Instructions"):

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; 
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.date,
      data.firstName,
      data.lastName,
      data.title,
      data.email,
      data.company,
      data.website,
      data.linkedinUrl,
      data.companyLinkedin,
      data.connectionMessageType,
      data.connectionSent,
      data.accepted,
      data.additionalNotes,
      data.whatOffer
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

4.  Click **Deploy** > **New Deployment**.
5.  Select type: **Web app**.
6.  Description: "Lead Grabber".
7.  Execute as: **Me**.
8.  **Who has access: Anyone** (Critical: This allows the extension to write to the sheet).
9.  Click **Deploy**, copy the **Web App URL**, and paste it into the Extension Settings.

## 📖 Usage Guide

1.  **Navigate** to a LinkedIn user's profile page.
2.  **Click** the ROYA extension icon to open the Side Panel.
3.  **Lead Extractor Tab:**
    *   Click "Clip Profile Data".
    *   Edit any details if necessary.
    *   Select a connection message strategy (AI or Template).
    *   Click "Save Lead" to send it to your Google Sheet.
4.  **Messaging Tab:**
    *   Switch to this tab after connecting.
    *   Select a stage (First Message, Value, Follow-up).
    *   Copy the template (variables are auto-filled) and paste it into LinkedIn chat.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
