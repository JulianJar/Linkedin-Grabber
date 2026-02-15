import { ExtractedData, UserSettings } from "../types";

export const DEFAULT_PROMPTS = {
    commonGround: `TARGET: {{firstName}}
PROFILE DATA:
- Headline: "{{title}}"
- Company Field: "{{company}}"

SENDER INFO:
- Target Audience: "{{myTargetAudience}}"
- Value Prop: "{{myValueProposition}}"

INSTRUCTIONS:
1. Analyze the "Headline" to extract the actual, specific Job Title (e.g. "CTO" instead of "CTO | Speaker | Visionary").
2. Extract the clean Company Name from the Company Field or Headline.
3. Write a message following this structure (filling in the brackets):
"Hi {{firstName}}, I see you're a [Clean Job Title] at [Clean Company]. I help {{myTargetAudience}} with {{myValueProposition}}. Would love to connect and learn more about what you're working on."`,
    
    industryConnection: `TARGET: {{firstName}}
PROFILE DATA:
- Headline: "{{title}}"
- Company Field: "{{company}}"

SENDER INFO:
- Target Audience: "{{myTargetAudience}}"
- Value Prop: "{{myValueProposition}}"

INSTRUCTIONS:
1. Infer the specific Industry from the Headline and Company.
2. Write a message following this structure (filling in the brackets):
"Hi {{firstName}}, noticed we're both in the [Inferred Industry] space. I work with {{myTargetAudience}} on {{myValueProposition}}. Would love to add you to my network."`,
    
    engagementHook: `TARGET: {{firstName}}
PROFILE DATA:
- Recent Post: "{{lastPostContent}}"

SENDER INFO:
- Target Audience: "{{myTargetAudience}}"
- Value Prop: "{{myValueProposition}}"

INSTRUCTIONS:
1. Extract the main topic from their post.
2. Write a message following this structure (filling in the brackets):
"Hi {{firstName}}, saw your recent post about [Topic]. [Brief specific compliment]. I help {{myTargetAudience}} with {{myValueProposition}}. Would love to connect."`
};

// Helper for robust fetching
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // If it's a 5xx error, throw to trigger retry. 4xx usually means client error (auth, bad request) so we don't retry those.
    if (!response.ok && response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Fetch failed, retrying... (${retries} left). Error: ${err}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export const generateConnectionMessage = async (
  templateType: string,
  leadData: Partial<ExtractedData>,
  settings: UserSettings,
  extraContext?: string
): Promise<string> => {
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API Key is missing. Please add it in Settings.");
  }

  const { firstName, title, company, lastPostContent } = leadData;
  const { myTargetAudience, myValueProposition, customPrompts } = settings;

  // Safeguard: Engagement Hook requires a post
  if (templateType === "The Engagement Hook" && !lastPostContent) {
      throw new Error("No recent post content was found on this profile. 'The Engagement Hook' cannot be used without a post. Please select a different template.");
  }

  const systemInstruction = `You are a B2B LinkedIn networking expert. 
CRITICAL: The 'Headline' data provided often contains long lists of keywords, pipes (|), and multiple roles. 
NEVER paste the full headline into the output message. 
ALWAYS infer and extract the single, most relevant Job Title (e.g. "VP of Sales" NOT "VP of Sales | SaaS | Hiring") and the clean Company Name. 
Keep the message under 300 characters. Professional but conversational. No hashtags.`;

  let promptTemplate = "";
  
  // Select the raw template
  switch (templateType) {
    case "The Common Ground Approach":
      promptTemplate = customPrompts?.commonGround || DEFAULT_PROMPTS.commonGround;
      break;
    case "The Industry Connection":
      promptTemplate = customPrompts?.industryConnection || DEFAULT_PROMPTS.industryConnection;
      break;
    case "The Engagement Hook":
      promptTemplate = customPrompts?.engagementHook || DEFAULT_PROMPTS.engagementHook;
      break;
    default:
        return "";
  }

  // Interpolate Variables
  let prompt = promptTemplate
    .replace(/{{firstName}}/g, firstName || "[First Name]")
    .replace(/{{title}}/g, title || "[Headline]")
    .replace(/{{company}}/g, company || "[Company]")
    .replace(/{{lastPostContent}}/g, lastPostContent || "[Recent Post Activity]")
    .replace(/{{myTargetAudience}}/g, myTargetAudience || "[My Target Audience]")
    .replace(/{{myValueProposition}}/g, myValueProposition || "[My Value Proposition]");

  // Append Extra Context if provided
  if (extraContext && extraContext.trim()) {
      prompt += `\n\nAdditional User Instructions/Context: "${extraContext.trim()}"\nImportant: Incorporate this context into the message naturally.`;
  }

  try {
    const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.openaiModel || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenAI returned no choices.");
    }

    return data.choices[0].message.content.trim().replace(/^"|"$/g, ''); // Remove quotes if AI adds them
  } catch (error: any) {
    console.error("AI Generation Error", error);
    // Provide a more user-friendly error message if it's a fetch failure
    if (error.message.includes('Failed to fetch')) {
        throw new Error("Network error: Could not reach OpenAI. Please check your internet connection.");
    }
    throw error;
  }
};