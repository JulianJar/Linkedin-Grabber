export interface MessageTemplate {
  id: string;
  title: string;
  category: 'connection' | 'firstMessage' | 'value' | 'followUp';
  content: string;
  stats?: string;
  description?: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // --- STEP 1: CONNECTION REQUEST ---
  {
    id: 'conn-blank',
    title: 'Option A: Blank Invite',
    category: 'connection',
    content: '',
    stats: '40-50% Acceptance',
    description: 'Best for volume (20-30+ daily). Let your profile do the talking.'
  },
  {
    id: 'conn-personalized',
    title: 'Option B: Personalized',
    category: 'connection',
    content: "Hi {firstName}, [specific observation about them]. [Connection to your work]. Would love to connect.",
    stats: '30-40% Acceptance',
    description: 'For high-value targets. Mention a post, article, or shared interest.'
  },

  // --- STEP 2: FIRST MESSAGE (Day 0-1) ---
  {
    id: 'fm-recent-post',
    title: '1. Recent Post',
    category: 'firstMessage',
    content: "Hi {firstName}, left you a like on your most recent post about {topic}. Your point on {detail} really hit home. Would love to discuss this further given your experience in {field}.",
    stats: '38% Reply Rate',
    description: 'Builds immediate rapport based on their content.'
  },
  {
    id: 'fm-straight-sell',
    title: '2. Straight Sell',
    category: 'firstMessage',
    content: "So yeah, hope you don’t mind the voice note - I thought it would be easier than writing a long message.\n\nI came across what you are doing and I wanted to suggest that we {suggestion}.\n\nWe’ve done the same thing for {similar_companies} so the goal here is essentially to {objective}.\n\nWould you be down for a quick call so that I can show you the results we typically get?",
    stats: '26% Reply Rate',
    description: 'Direct approach. Works best with Voice Note.'
  },
  {
    id: 'fm-event-attendee',
    title: '3. Previous Event',
    category: 'firstMessage',
    content: "I always find it hard to find event replays, so now I just record every event I attend 😅\n\nHere's the replay link: {link}\n\nPS: I also create a Notion doc for every event I attend, if you just want the key takeaways - let me know.",
    stats: '35% Reply Rate',
    description: 'High value for fellow attendees.'
  },
  {
    id: 'fm-pain-points',
    title: '4. Pain Points',
    category: 'firstMessage',
    content: "{firstName}, saw that you offer {service} for {industry}.\n\nI spoke to another {role} in {industry} and they told me that they often run into issues like {pain_point}\n\nDo you guys see any of these issues at {company}?",
    stats: '31% Reply Rate',
    description: 'Validates a common problem.'
  },
  {
    id: 'fm-free-resource',
    title: '5. Free Resource',
    category: 'firstMessage',
    content: "Hey hey {firstName}!\n\n53% of {target_audience} say {pain_point} is their biggest challenge.\n\nCould I share a template that’s getting {outcome}?",
    stats: '29% Reply Rate',
    description: 'Data-backed value offer.'
  },
  {
    id: 'fm-comment',
    title: '6. Comment from Post',
    category: 'firstMessage',
    content: "Your comment on {creator}’s post really stood out from all the other ChatGPT ones I saw haha\n\nFound it super interesting and told myself I’ve got to connect with you\n\nHow’s everything going for you?",
    stats: '37% Reply Rate',
    description: 'Flattery + Shared Context.'
  },
  {
    id: 'fm-partnership',
    title: '7. Partnership Offer',
    category: 'firstMessage',
    content: "Hey {firstName}, I’ve got a client that’s interested in {service}, similar to what you guys offer. Is it worth talking about a potential partnership? (if so, we have a lot of leads in the pipeline for you)",
    stats: '45% Reply Rate',
    description: 'High value partnership proposal.'
  },
  {
    id: 'fm-case-study',
    title: '8. Case Study',
    category: 'firstMessage',
    content: "{company} is similar to {client}, who achieved {outcome} in {timeframe} working with us. Mind if I share a little more info on how you guys could get a similar result?",
    stats: '31% Reply Rate',
    description: 'Social proof leverage.'
  },
  {
    id: 'fm-networking',
    title: '9. Networking',
    category: 'firstMessage',
    content: "Hey dude, how’s {location}? heard you guys have got some good {location_highlight}. I’m in the {industry} space working with similar people to you and thought it would be beneficial to have someone like you in my contacts.",
    stats: '28% Reply Rate',
    description: 'Casual networking.'
  },
  {
    id: 'fm-feedback',
    title: '10. Get Feedback',
    category: 'firstMessage',
    content: "Hey {firstName}, saw you’re an expert in {field} - mind if I ask you a couple of questions? We’re tryna gather some feedback on our {product} from people that know the space",
    stats: '39% Reply Rate',
    description: 'Ego-bait / Expert opinion.'
  },

  // --- STEP 4/CAMPAIGNS: VALUE & LEAD MAGNET ---
  {
    id: 'val-soft-magnet',
    title: 'Soft Lead Magnet Offer',
    category: 'value',
    content: "Hey {firstName},\n\nBased on what you mentioned about [challenge], I think you'd find [Lead Magnet Name] helpful.\n\nIt's a [Format] I put together that shows [Benefit]. [One sentence summary].\n\nWant me to send it over?",
    description: 'Best for Day 4-5 after building rapport.'
  },
  {
    id: 'val-direct-magnet',
    title: 'Direct Lead Magnet Offer',
    category: 'value',
    content: "Hey {firstName},\n\nI just put together [Lead Magnet Name]—it's specifically for {ideal_clients} dealing with {problem}.\n\nInside: [3-5 bullet points]\n\nThought it might be useful for you at {company}. Want the link?",
    description: 'Skip rapport, offer immediate value.'
  },
  {
    id: 'cmp-2-msg-1',
    title: 'Camp 2: Offer (Day 0)',
    category: 'followUp',
    content: "Hey {firstName},\n\nI've been working with {ideal_clients} who are dealing with {problem}.\n\nI just put together a {format} called \"{Lead Magnet Name}\" that shows {benefit}.\n\nThought it might be helpful for you. Want me to send it over?",
    description: 'Re-engage connections who missed earlier messages.'
  },
  {
    id: 'cmp-2-msg-2',
    title: 'Camp 2: Follow-up (Day 3)',
    category: 'followUp',
    content: "Hey {firstName}, just wanted to make sure you saw my last message about {Lead Magnet Name}.\n\nIt's free, takes about {time} to go through, and {benefit}.\n\nHere's the link if you want to check it out: {link}\n\nNo worries if it's not relevant!",
    description: 'Gentle bump with direct link.'
  },
  {
    id: 'cmp-2-msg-3',
    title: 'Camp 2: Social Proof (Day 7)',
    category: 'followUp',
    content: "Hey {firstName},\n\nI wanted to share a quick win with you.\n\nI just helped {client_type} go from {before} to {after} in {timeframe} using {method}.\n\nThey were dealing with {problem}—not sure if that's something you're facing at {company}, but thought I'd share.\n\nIf you ever want to chat about {topic}, I'm always happy to help.",
    description: 'Share a win, open door, no pressure.'
  },
  {
    id: 'cmp-3-msg-1',
    title: 'Camp 3: Aggressive (Day 0)',
    category: 'value',
    content: "Hey {firstName}, thanks for connecting!\n\nI just put together {Lead Magnet Name} for {ideal_clients} dealing with {problem}.\n\nIt shows {outcome} in {timeframe}. [One sentence summary].\n\nHere's the link: {link}\n\nLet me know what you think!",
    description: 'Fast track for high volume.'
  }
];