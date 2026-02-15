import { Lead } from "../types";

// Helper for robust fetching with timeout and retries
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
  try {
    // Add a timeout controller
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000); // Increased to 30s to handle slow Google Scripts

    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    
    clearTimeout(id);

    // Google Scripts often return 200 even on error, but if it's a 5xx/429/408/504/503/502/500 we should retry
    if (!response.ok && (response.status >= 500 || response.status === 429)) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  } catch (err: any) {
    // CRITICAL: Do NOT retry on timeout (AbortError) for POST requests to avoid duplicates.
    // If the server received the request but was slow to reply, retrying would add a second row.
    if (err.name === 'AbortError') {
         throw new Error("Connection timed out. Google Sheets took too long to respond.");
    }

    // Retry logic for other errors (Network failed to fetch, 5xx)
    if (retries > 0) {
      console.warn(`Fetch failed, retrying... (${retries} left). Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export const saveToGoogleSheet = async (lead: Lead, scriptUrl: string): Promise<void> => {
  if (!scriptUrl) throw new Error("Script URL is missing");

  try {
    const response = await fetchWithRetry(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status} ${response.statusText}`);
    }
    
    // Attempt to parse JSON. If the script fails silently or returns HTML error page (common with GAS), this will catch it.
    let result;
    try {
        const text = await response.text();
        // Check if response is empty
        if (!text) {
             // Sometimes GAS returns empty body on success if not configured correctly.
             throw new Error("Received empty response from Google Sheet script.");
        }
        result = JSON.parse(text);
    } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from Google Sheet. Check script deployment settings (Anyone/Anonymous).");
    }

    if (result.status !== 'success') {
       throw new Error(`Google Sheet Script Error: ${result.message || 'Unknown error'}`);
    }

  } catch (error: any) {
    console.error("Google Sheet Upload Error:", error);
    
    // Pass through specific errors
    throw error;
  }
};

export const generateScriptCode = (sheetId: string) => {
    return `function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish.
    lock.waitLock(30000); 
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; 

    var data = JSON.parse(e.postData.contents);

    // Append Row (Columns A-N):
    // Date | First Name | Last Name | Headline | Email | Company | Website | LinkedIn | Company LinkedIn | Connection Message Type | Connection Sent? | Accepted? | Additional Info | What Offer?
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
}`;
}