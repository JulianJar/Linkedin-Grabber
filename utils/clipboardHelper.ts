import { Lead } from "../types";

export const copyLeadToClipboard = async (lead: Lead): Promise<void> => {
  // Columns A-N:
  // Date, First Name, Last Name, Headline, Email, Company, Website, LinkedIn, Company LinkedIn, Connection Message Type, Connection Sent?, Accepted?, Additional Info, What Offer?
  const row = [
    lead.date,
    lead.firstName,
    lead.lastName,
    lead.title,
    lead.email,
    lead.company,
    lead.website,
    lead.linkedinUrl,
    lead.companyLinkedin,
    lead.connectionMessageType,
    lead.connectionSent,
    lead.accepted,
    lead.additionalNotes,
    lead.whatOffer
  ].join("\t");

  try {
    await navigator.clipboard.writeText(row);
  } catch (err) {
    console.error("Failed to copy text: ", err);
    throw err;
  }
};