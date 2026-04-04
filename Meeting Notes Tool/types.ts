
export interface Attendee {
  id: string;
  name: string;
  affiliation: string;
  position: string;
  signature?: string | null;
}

export interface MeetingMinutesData {
  sponsoringOrganization: string;
  supportProject: string;
  date: { year: string, month: string, day: string };
  time: { startH: string, startM: string, endH: string, endM: string };
  location: string;
  agenda: string;
  attendeeSummary: string;
  meetingContent: string[];
  researcherInCharge: string;
  claimedAmount: string;
  attachments: string[];
  attendees: {
    name: string;
    affiliation: string;
    position: string;
  }[];
}
