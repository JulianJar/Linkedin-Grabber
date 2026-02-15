import { ExtractedData } from "../types";

export const scrapeLinkedInProfile = (): ExtractedData & { url: string } => {
  // --- HELPER FUNCTIONS ---

  const clean = (text: string | undefined | null) => {
    if (!text) return '';
    // Remove newlines, excessive spaces
    let cleaned = text.replace(/\s+/g, ' ').trim();
    return cleaned;
  };

  const isGarbage = (text: string) => {
    if (!text) return true;
    const lower = text.toLowerCase();
    // Check for code/scripts that might have slipped through
    if (text.includes('function') || text.includes('window.') || text.includes('{') || text.includes('var ')) return true;
    // Check for nav bar items / numbers
    if (text === '0' || !isNaN(Number(text))) return true;
    if (['notifications', 'messaging', 'my network', 'home', 'jobs', 'advertising', 'contact info', 'edit', 'verify now'].includes(lower)) return true;
    if (lower.includes('keyboard shortcuts')) return true;
    return false;
  };

  const getTextFromSelectors = (root: ParentNode, selectors: string[]): string => {
    for (const sel of selectors) {
      const els = root.querySelectorAll(sel);
      for (const el of els) {
         // CRITICAL: Explicitly ignore script/style tags to prevent code from appearing in fields
         if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;
         
         // Get direct text if possible to avoid nested hidden elements
         const text = clean((el as HTMLElement).innerText);
         if (text && !isGarbage(text)) {
           return text;
         }
      }
    }
    return '';
  };

  // --- MAIN LOGIC ---

  // 1. Target the Main Profile Card
  const topCard = document.querySelector('.pv-top-card') || document.querySelector('.scaffold-layout__main');
  
  if (!topCard) {
    // Fallback: Use document title
    const titleParts = document.title.split('|')[0].trim().split(' ');
    return {
      firstName: titleParts[0] || '',
      lastName: titleParts.slice(1).join(' ') || '',
      title: '',
      company: '',
      companyLinkedin: '',
      lastPostContent: '',
      url: window.location.href
    };
  }

  // 2. NAME EXTRACTION
  let fullName = getTextFromSelectors(topCard, [
    'h1',
    '.text-heading-xlarge',
    '[data-generated-suggestion-target="name"]'
  ]);

  if (!fullName) {
    fullName = document.title.split('|')[0].replace(/\([0-9]+\)/g, '').trim();
  }

  // 3. HEADLINE (TITLE) EXTRACTION
  let title = '';
  
  // Strategy A: Explicit Data Attribute (Most accurate)
  title = getTextFromSelectors(topCard, [
    '[data-generated-suggestion-target="headline"]'
  ]);

  // Strategy B: Class based (Standard Desktop)
  if (!title) {
      title = getTextFromSelectors(topCard, [
        '.pv-text-details__left-panel .text-body-medium.break-words', 
        '.text-body-medium.break-words'
      ]);
  }

  // Strategy C: Manual Sibling Traversal (Fallback)
  if (!title || title.includes(' Area') || (title.includes(',') && title.length < 20)) {
      const nameEl = topCard.querySelector('h1');
      if (nameEl) {
          // Look at the elements immediately following the name
          let current = nameEl.parentElement?.nextElementSibling || nameEl.nextElementSibling;
          
          // Try up to 3 siblings
          for(let i=0; i<3; i++) {
              if(!current) break;
              const text = clean((current as HTMLElement).innerText);
              
              if (text && !isGarbage(text) && !text.toLowerCase().includes('contact info')) {
                  if (!text.includes(' Area') && text.length > 3) {
                      title = text;
                      break;
                  }
              }
              current = current.nextElementSibling;
          }
      }
  }

  // 4. COMPANY EXTRACTION
  let company = '';
  let companyLinkedin = '';
  
  const companyButton = topCard.querySelector('button[aria-label*="Current company"], a[aria-label*="Current company"]');
  if (companyButton) {
      // Get Name
      const label = companyButton.getAttribute('aria-label') || '';
      const match = label.match(/Current company: (.*?)\./);
      if (match && match[1]) {
          company = match[1];
      } else {
          company = clean((companyButton as HTMLElement).innerText);
      }

      // Get Link
      const anchor = companyButton.tagName === 'A' ? companyButton : companyButton.closest('a');
      if (anchor) {
        // Typically /company/name/
        let href = (anchor as HTMLAnchorElement).href;
        if (href.startsWith('/')) href = 'https://www.linkedin.com' + href;
        if (href.includes('linkedin.com/company')) {
            companyLinkedin = href.split('?')[0]; // Clean params
        }
      }
  }

  // Fallback: Parse from Headline
  if (!company && title) {
    const separators = [' at ', ' @ ', ' | '];
    for (const sep of separators) {
        if (title.includes(sep)) {
            const parts = title.split(sep);
            company = parts[parts.length - 1]; 
            break;
        }
    }
  }

  // 5. RECENT ACTIVITY (POSTS)
  let lastPostContent = '';
  
  // Find Activity Section
  // We look for sections that might contain the activity.
  const allSections = document.querySelectorAll('section');
  let activitySection: Element | null = null;
  
  // Strategy 1: Find by Header Text
  for (const sec of allSections) {
      // Check for header
      const header = sec.querySelector('.pvs-header__title, span.pvs-header__title-text') || sec.querySelector('h2');
      if (header) {
          const text = (header as HTMLElement).innerText || '';
          if (text.includes('Activity') && !text.includes('Articles')) {
              activitySection = sec;
              break;
          }
      }
      // Check for ID
      if (sec.id && sec.id.includes('activity')) {
          activitySection = sec;
          break;
      }
  }

  if (activitySection) {
      // Find list items
      // They are often in a ul > li structure within .pvs-list__outer-container
      const items = activitySection.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item');
      
      for (const item of items) {
          // Find text content
          // 1. Try .inline-show-more-text (Used for "Post content...")
          // 2. Try .feed-shared-update-v2__description (Used in full feed view)
          // 3. Try span.break-words (Generic)
          
          const textCandidates = item.querySelectorAll('.inline-show-more-text, .feed-shared-update-v2__description .update-components-text, span.break-words');
          
          for (const candidate of textCandidates) {
              const text = clean((candidate as HTMLElement).innerText);
              
              if (text && text.length > 15) {
                  const lower = text.toLowerCase();
                  // Filter out metadata
                  if (
                      !lower.startsWith('liked by') &&
                      !lower.startsWith('reposted') &&
                      !lower.includes('commented on this') &&
                      !lower.includes('likes') && 
                      !lower.includes('comments') &&
                      !lower.includes('followers')
                  ) {
                      lastPostContent = text;
                      break; 
                  }
              }
          }
          if (lastPostContent) break; // Found latest post
      }
  }

  // --- FINAL CLEANUP ---
  fullName = fullName.replace(/\(.*\)/g, '').trim(); 
  fullName = fullName.replace(/ (1st|2nd|3rd|In)$/, '').trim();

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    title,
    company,
    companyLinkedin,
    lastPostContent,
    url: window.location.href.split('?')[0] // Clean URL params
  };
};