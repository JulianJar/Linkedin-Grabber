import { ExtractedData } from "../types";

export const scrapeLinkedInProfile = (): ExtractedData & { url: string } => {
  // --- HELPER FUNCTIONS ---

  const clean = (text: string | undefined | null) => {
    if (!text) return '';
    // Remove newlines, excessive spaces
    let cleaned = text.replace(/[\s\u00A0]+/g, ' ').trim();
    return cleaned;
  };

  const isGarbage = (text: string) => {
    if (!text) return true;
    const lower = text.toLowerCase();
    
    // Explicitly ignore "0 notifications" or "5 notifications" type strings
    if (lower.includes('notifications') && text.length < 30) return true;

    // Check for code/scripts that might have slipped through
    if (text.includes('function') || text.includes('window.') || text.includes('{') || text.includes('var ')) return true;
    
    // Check for nav bar items / numbers
    if (text === '0' || !isNaN(Number(text))) return true;
    if (['messaging', 'my network', 'home', 'jobs', 'advertising', 'contact info', 'edit', 'verify now', 'save', 'more'].includes(lower)) return true;
    
    if (lower.includes('keyboard shortcuts')) return true;
    
    // Check for connection degree indicators (e.g. "· 1st", "1st", "2nd")
    const cleanDegree = lower.replace(/[·\.]/g, '').trim();
    if (['1st', '2nd', '3rd', 'in', 'out of network'].includes(cleanDegree)) return true;

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
  const topCard = document.querySelector('.pv-top-card') 
             || document.querySelector('.scaffold-layout__main') 
             || document.querySelector('main')
             || document.body;
  
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

  // 2. NAME EXTRACTION (LOGIC UNTOUCHED AS REQUESTED)
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

  // Strategy C: Manual Traversal (Robust Fallback for Verified/Complex Layouts)
  if (!title || title.includes(' Area') || (title.includes(',') && title.length < 20)) {
      // 1. Locate the Name Element using the already extracted fullName
      // We search h1, h2, h3, spans, divs to find the node containing the exact name
      const candidates = topCard.querySelectorAll('h1, h2, .text-heading-xlarge, span, div');
      let nameEl: Element | null = null;
      
      for(const el of candidates) {
          if (clean((el as HTMLElement).innerText) === fullName) {
              nameEl = el;
              break;
          }
      }

      // 2. Walk up and scan siblings
      if (nameEl) {
          let current: Element | null = nameEl;
          let levels = 0;
          let found = false;
          
          // Walk up the DOM tree (max 6 levels) to find the container row
          while (current && levels < 6) {
             // Look at next siblings of the current ancestor
             let sibling = current.nextElementSibling;
             let scanCount = 0;

             while(sibling && scanCount < 10) { // Scan up to 10 siblings
                 const rawText = clean((sibling as HTMLElement).innerText);
                 
                 if (rawText && !isGarbage(rawText) && rawText !== fullName) {
                     const lower = rawText.toLowerCase();
                     // Heuristics:
                     // 1. Not "Contact info"
                     // 2. Not connection count ("500+ connections")
                     // 3. Not location (usually contains comma and "Area" or "United") - though some headlines might too.
                     // 4. Headlines are usually substantial (> 5 chars).
                     
                     const isLocation = lower.includes('united kingdom') || lower.includes('united states') || lower.includes(' area');
                     const isMeta = lower.includes('connections') || lower.includes('followers') || lower.includes('contact info');

                     if (!isLocation && !isMeta) {
                          title = rawText;
                          found = true;
                          break;
                     }
                 }
                 sibling = sibling.nextElementSibling;
                 scanCount++;
             }
             
             if (found) break;
             current = current.parentElement;
             levels++;
          }
      }
  }

  // 4. COMPANY EXTRACTION
  let company = '';
  let companyLinkedin = '';
  
  // Strategy: Find Experience Section first
  let experienceSection = document.getElementById('experience')?.closest('section');
  
  // Fallback if ID not found (sometimes it's dynamic)
  if (!experienceSection) {
      const headers = document.querySelectorAll('h2, span.pvs-header__title-text');
      for (const h of headers) {
          if (clean((h as HTMLElement).innerText).toLowerCase() === 'experience') {
              experienceSection = h.closest('section');
              break;
          }
      }
  }

  if (experienceSection) {
      // Get the first experience item
      const firstItem = experienceSection.querySelector(
          'li.artdeco-list__item, li.pvs-list__paged-list-item, div[componentkey^="entity-collection-item"]'
      );

      if (firstItem) {
          // 1. Find all Company Links in this item
          const companyAnchors = firstItem.querySelectorAll('a[href*="/company/"]');
          
          for (const anchor of companyAnchors) {
              // Get URL
              if (!companyLinkedin) {
                  let href = (anchor as HTMLAnchorElement).href;
                  if (href.startsWith('/')) href = 'https://www.linkedin.com' + href;
                  companyLinkedin = href.split('?')[0];
              }

              // Get Name from Logo Alt Text (High Reliability)
              const img = anchor.querySelector('img[alt*=" logo"]');
              if (img && !company) {
                  company = (img.getAttribute('alt') || '').replace(/ logo$/i, '').trim();
              }

              // Get Name from Text Content inside Anchor (if not found via logo)
              if (!company) {
                  // The text content might be multi-line (Name \n Duration)
                  // We take the first non-empty line
                  const lines = (anchor as HTMLElement).innerText.split('\n');
                  for (const line of lines) {
                      const t = clean(line);
                      if (t && !isGarbage(t) && !t.match(/\b(mos|yrs|mo|yr|Present|Full-time)\b/)) {
                          company = t;
                          break;
                      }
                  }
              }
          }
      }
  }

  // Fallback: Top Card extraction (if Experience section failed)
  if (!company) {
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
          if (anchor && !companyLinkedin) {
              let href = (anchor as HTMLAnchorElement).href;
              if (href.startsWith('/')) href = 'https://www.linkedin.com' + href;
              if (href.includes('linkedin.com/company')) {
                  companyLinkedin = href.split('?')[0]; 
              }
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
  const allSections = document.querySelectorAll('section');
  let activitySection: Element | null = null;
  
  for (const sec of allSections) {
      const header = sec.querySelector('.pvs-header__title, span.pvs-header__title-text') || sec.querySelector('h2');
      if (header) {
          const text = (header as HTMLElement).innerText || '';
          if (text.includes('Activity') && !text.includes('Articles')) {
              activitySection = sec;
              break;
          }
      }
      if (sec.id && sec.id.includes('activity')) {
          activitySection = sec;
          break;
      }
  }

  if (activitySection) {
      const items = activitySection.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item');
      for (const item of items) {
          const textCandidates = item.querySelectorAll('.inline-show-more-text, .feed-shared-update-v2__description .update-components-text, span.break-words');
          for (const candidate of textCandidates) {
              const text = clean((candidate as HTMLElement).innerText);
              if (text && text.length > 15) {
                  const lower = text.toLowerCase();
                  if (!lower.startsWith('liked by') && !lower.startsWith('reposted') && !lower.includes('commented on this') && !lower.includes('likes') && !lower.includes('comments') && !lower.includes('followers')) {
                      lastPostContent = text;
                      break; 
                  }
              }
          }
          if (lastPostContent) break;
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