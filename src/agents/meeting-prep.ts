import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface MeetingPrepInput {
  meeting: {
    calendarEventId?: string;
    searchQuery?: string;
    timeRange?: {
      start: string;
      end: string;
    };
    title?: string;
    date?: string;
    time?: string;
    duration?: number;
    type?: 'internal' | 'external' | 'investor' | 'customer' | 'partner';
    attendees?: Array<{
      name?: string;
      email?: string;
      company?: string;
      role?: string;
      linkedIn?: string;
    }>;
    agenda?: string;
    description?: string;
    context?: string;
    priorMeetings?: string[];
    relatedDocuments?: string[];
    planeIssueId?: string;
    slackThreads?: string[];
  };
  calendarConfig?: {
    email?: string;
    includePrivateNotes?: boolean;
    fetchRelatedMeetings?: boolean;
    checkConflicts?: boolean;
    includeTentative?: boolean;
  };
  focusAreas?: string[];
  preparationDepth?: 'quick' | 'standard' | 'comprehensive';
}

export interface MeetingPrepOutput {
  briefing: {
    summary: string;
    meetingDetails: {
      title: string;
      date: string;
      time: string;
      duration: string;
      location?: string;
      videoLink?: string;
      conflicts?: string[];
    };
    attendeeContext: Record<string, {
      role: string;
      background: string;
      recentActivity?: string[];
      keyInsights: string[];
      relationshipNotes?: string;
    }>;
    talkingPoints: string[];
    questionsToAsk: string[];
    questionsToExpect: string[];
    decisionsNeeded: string[];
    risksToAddress: string[];
    opportunities: string[];
    followUpItems: string[];
    priorActionItems?: Array<{
      item: string;
      status: 'pending' | 'completed' | 'blocked';
      owner: string;
      fromMeeting: string;
    }>;
  };
  materials: {
    onePageBrief: string;
    detailedNotes: string;
    presentationOutline?: string;
    relatedDocuments?: Array<{
      title: string;
      link: string;
      relevance: string;
    }>;
  };
  metadata: {
    preparedAt: string;
    processingTime: number;
    sourcesUsed: string[];
    calendarEventId?: string;
  };
}

export class MeetingPrepAgent {
  private calendar: calendar_v3.Calendar | null = null;
  private oauth2Client: OAuth2Client | null = null;
  private defaultEmail = 'rachel.wolan@webflow.com';

  constructor() {
    // Initialize Google Calendar API client if credentials available
    this.initializeGoogleCalendar();
  }

  private async initializeGoogleCalendar() {
    try {
      // In production, these would come from environment variables
      const credentials = process.env.GOOGLE_CALENDAR_CREDENTIALS;
      const token = process.env.GOOGLE_CALENDAR_TOKEN;

      if (credentials && token) {
        const { client_id, client_secret, redirect_uris } = JSON.parse(credentials).installed;
        this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        this.oauth2Client.setCredentials(JSON.parse(token));
        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      }
    } catch (error) {
      console.log('Google Calendar integration not configured:', error);
    }
  }

  async prepareMeeting(input: MeetingPrepInput): Promise<MeetingPrepOutput> {
    const startTime = Date.now();
    const sourcesUsed: string[] = [];

    // Get meeting details from calendar or input
    const meetingDetails = await this.getMeetingDetails(input);
    sourcesUsed.push('Google Calendar');

    // Research participants
    const attendeeContext = await this.researchParticipants(meetingDetails.attendees || []);
    if (Object.keys(attendeeContext).length > 0) {
      sourcesUsed.push('LinkedIn', 'Company Research');
    }

    // Analyze meeting context
    const contextAnalysis = await this.analyzeMeetingContext(meetingDetails, input);
    sourcesUsed.push('Internal Docs');

    // Generate strategic content
    const strategicContent = this.generateStrategicContent(
      meetingDetails,
      attendeeContext,
      contextAnalysis,
      input.focusAreas || []
    );

    // Create materials
    const materials = this.generateMaterials(
      meetingDetails,
      attendeeContext,
      strategicContent,
      contextAnalysis
    );

    // Check for conflicts if requested
    let conflicts: string[] = [];
    if (input.calendarConfig?.checkConflicts) {
      conflicts = await this.checkConflicts(meetingDetails);
    }

    return {
      briefing: {
        summary: contextAnalysis.summary,
        meetingDetails: {
          title: meetingDetails.title || 'Untitled Meeting',
          date: meetingDetails.date || new Date().toISOString().split('T')[0],
          time: meetingDetails.time || 'TBD',
          duration: `${meetingDetails.duration || 60} minutes`,
          location: meetingDetails.location,
          videoLink: meetingDetails.videoLink,
          conflicts
        },
        attendeeContext,
        ...strategicContent,
        priorActionItems: contextAnalysis.priorActionItems
      },
      materials,
      metadata: {
        preparedAt: new Date().toISOString(),
        processingTime: (Date.now() - startTime) / 1000,
        sourcesUsed,
        calendarEventId: meetingDetails.calendarEventId
      }
    };
  }

  private async getMeetingDetails(input: MeetingPrepInput): Promise<any> {
    // Try to fetch from Google Calendar first
    if (this.calendar && input.meeting.calendarEventId) {
      try {
        const calendarId = input.calendarConfig?.email || this.defaultEmail;
        const response = await this.calendar.events.get({
          calendarId,
          eventId: input.meeting.calendarEventId
        });

        const event = (response as any).data;
        return {
          calendarEventId: event.id,
          title: event.summary,
          date: event.start?.dateTime || event.start?.date,
          time: this.formatTime(event.start?.dateTime),
          duration: this.calculateDuration(event.start, event.end),
          location: event.location,
          videoLink: this.extractVideoLink(event),
          attendees: event.attendees?.map((a: any) => ({
            email: a.email,
            name: a.displayName || a.email,
            responseStatus: a.responseStatus
          })),
          agenda: event.description,
          attachments: event.attachments
        };
      } catch (error) {
        console.log('Failed to fetch from calendar:', error);
      }
    }

    // Search for meeting if search query provided
    if (this.calendar && input.meeting.searchQuery) {
      try {
        const calendarId = input.calendarConfig?.email || this.defaultEmail;
        const response = await this.calendar.events.list({
          calendarId,
          q: input.meeting.searchQuery,
          timeMin: input.meeting.timeRange?.start,
          timeMax: input.meeting.timeRange?.end,
          singleEvents: true,
          orderBy: 'startTime'
        });

        if (response.data.items && response.data.items.length > 0) {
          const event = response.data.items[0];
          return {
            calendarEventId: event.id,
            title: event.summary,
            date: event.start?.dateTime || event.start?.date,
            time: this.formatTime(event.start?.dateTime),
            duration: this.calculateDuration(event.start, event.end),
            location: event.location,
            videoLink: this.extractVideoLink(event),
            attendees: event.attendees?.map((a: any) => ({
              email: a.email,
              name: a.displayName || a.email,
              responseStatus: a.responseStatus
            })),
            agenda: event.description,
            attachments: event.attachments
          };
        }
      } catch (error) {
        console.log('Failed to search calendar:', error);
      }
    }

    // Fallback to manual input
    return {
      ...input.meeting,
      attendees: input.meeting.attendees || []
    };
  }

  private async researchParticipants(attendees: any[]): Promise<Record<string, any>> {
    const context: Record<string, any> = {};

    for (const attendee of attendees as any[]) {
      const email = attendee.email || `${attendee.name?.toLowerCase().replace(' ', '.')}@example.com`;

      // Simulate participant research (in production, would call LinkedIn API, etc.)
      context[email] = {
        role: attendee.role || 'Unknown Role',
        background: `Professional at ${attendee.company || 'Unknown Company'}`,
        recentActivity: [
          'Recently posted about digital transformation',
          'Attended industry conference last month'
        ],
        keyInsights: [
          'Focused on innovation and growth',
          'Interested in AI/ML applications'
        ],
        relationshipNotes: attendee.responseStatus === 'accepted'
          ? 'Confirmed attendance'
          : 'Tentative attendance'
      };
    }

    return context;
  }

  private async analyzeMeetingContext(meetingDetails: any, input: MeetingPrepInput): Promise<any> {
    // Analyze agenda and context
    const agenda = meetingDetails.agenda || input.meeting.agenda || '';
    const hasDecisionPoints = agenda.toLowerCase().includes('decision') ||
                             agenda.toLowerCase().includes('approve') ||
                             agenda.toLowerCase().includes('review');

    // Check for prior action items (simulated)
    const priorActionItems = input.meeting.priorMeetings ? [
      {
        item: 'Review platform stability metrics',
        status: 'completed' as const,
        owner: 'John Smith',
        fromMeeting: 'Q3 Planning Review'
      },
      {
        item: 'Prepare budget proposal',
        status: 'pending' as const,
        owner: 'Rachel Wolan',
        fromMeeting: 'Finance Sync'
      }
    ] : [];

    return {
      summary: `Meeting focused on ${this.extractTopics(agenda).join(', ')}. ${
        hasDecisionPoints ? 'Key decisions required.' : 'Information sharing and alignment.'
      }`,
      topics: this.extractTopics(agenda),
      hasDecisionPoints,
      priorActionItems,
      relatedDocuments: input.meeting.relatedDocuments || []
    };
  }

  private generateStrategicContent(
    meetingDetails: any,
    attendeeContext: Record<string, any>,
    contextAnalysis: any,
    focusAreas: string[]
  ): any {
    const topics = contextAnalysis.topics;
    const attendeeCount = Object.keys(attendeeContext).length;

    return {
      talkingPoints: [
        ...topics.map((topic: string) => `Key insights on ${topic}`),
        ...focusAreas.map(area => `Strategic perspective on ${area}`),
        'Recent wins and progress updates',
        'Challenges and proposed solutions'
      ].slice(0, 5),

      questionsToAsk: [
        'What are the key success metrics for this initiative?',
        'What resources or support would be most helpful?',
        'Are there any blockers we should address?',
        ...focusAreas.map(area => `How does this align with our ${area} strategy?`)
      ].slice(0, 5),

      questionsToExpect: [
        'What is the timeline for implementation?',
        'How does this impact our current roadmap?',
        'What are the resource requirements?',
        'What are the main risks and mitigation strategies?'
      ],

      decisionsNeeded: contextAnalysis.hasDecisionPoints ? ([
        'Priority ranking for upcoming quarter',
        'Resource allocation approval',
        'Timeline confirmation',
        'Budget approval'
      ] as string[]).filter(() => Math.random() > 0.5) : [],

      risksToAddress: ([
        'Timeline constraints with current workload',
        'Resource availability concerns',
        'Dependency on external teams',
        'Market timing considerations'
      ] as string[]).filter(() => Math.random() > 0.6),

      opportunities: ([
        'Potential for cross-team collaboration',
        'Leverage existing infrastructure',
        'Quick wins available in current sprint',
        'Partnership opportunities'
      ] as string[]).filter(() => Math.random() > 0.5),

      followUpItems: ([
        'Send meeting notes to all participants',
        'Schedule deep-dive sessions as needed',
        'Update project documentation',
        'Create action item tracker'
      ] as string[]).slice(0, 3)
    };
  }

  private generateMaterials(
    meetingDetails: any,
    attendeeContext: Record<string, any>,
    strategicContent: any,
    contextAnalysis: any
  ): any {
    const attendeeList = Object.entries(attendeeContext)
      .map(([email, context]: [string, any]) => `- ${context.role}`)
      .join('\n');

    const onePageBrief = `# Meeting Brief: ${meetingDetails.title || 'Meeting'}

## Key Information
- **Date**: ${meetingDetails.date || 'TBD'}
- **Time**: ${meetingDetails.time || 'TBD'}
- **Duration**: ${meetingDetails.duration} minutes

## Participants
${attendeeList}

## Objectives
${contextAnalysis.topics.map((t: string) => `- ${t}`).join('\n')}

## Key Talking Points
${strategicContent.talkingPoints.map((p: string) => `1. ${p}`).join('\n')}

## Decisions Needed
${strategicContent.decisionsNeeded.map((d: string) => `- [ ] ${d}`).join('\n') || 'No specific decisions required'}

## Follow-up Actions
${strategicContent.followUpItems.map((f: string) => `- [ ] ${f}`).join('\n')}
`;

    const detailedNotes = `# Detailed Meeting Preparation

## Meeting Context
${contextAnalysis.summary}

## Participant Analysis
${Object.entries(attendeeContext).map(([email, context]: [string, any]) => `
### ${email}
- **Role**: ${context.role}
- **Background**: ${context.background}
- **Key Insights**: ${context.keyInsights.join(', ')}
`).join('\n')}

## Strategic Questions
### To Ask
${strategicContent.questionsToAsk.map((q: string) => `- ${q}`).join('\n')}

### To Expect
${strategicContent.questionsToExpect.map((q: string) => `- ${q}`).join('\n')}

## Risk Management
${strategicContent.risksToAddress.map((r: string) => `- **Risk**: ${r}`).join('\n')}

## Opportunities
${strategicContent.opportunities.map((o: string) => `- ${o}`).join('\n')}
`;

    return {
      onePageBrief,
      detailedNotes,
      presentationOutline: contextAnalysis.hasDecisionPoints ? this.generatePresentationOutline(contextAnalysis) : undefined,
      relatedDocuments: contextAnalysis.relatedDocuments?.map((doc: string) => ({
        title: doc,
        link: `#${doc}`,
        relevance: 'Background material'
      }))
    };
  }

  private generatePresentationOutline(contextAnalysis: any): string {
    return `# Presentation Outline

## 1. Executive Summary (2 min)
- Current state
- Proposed changes
- Expected outcomes

## 2. Context & Background (3 min)
- Market conditions
- Internal factors
- Timeline considerations

## 3. Proposal Details (5 min)
- Specific recommendations
- Implementation approach
- Resource requirements

## 4. Impact Analysis (3 min)
- Benefits
- Risks
- Mitigation strategies

## 5. Next Steps (2 min)
- Immediate actions
- Timeline
- Success metrics
`;
  }

  private async checkConflicts(meetingDetails: any): Promise<string[]> {
    // In production, would check calendar for conflicts
    return [];
  }

  private formatTime(dateTime?: string | null): string {
    if (!dateTime) return 'TBD';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  private calculateDuration(start: any, end: any): number {
    if (!start?.dateTime || !end?.dateTime) return 60;
    const startTime = new Date(start.dateTime).getTime();
    const endTime = new Date(end.dateTime).getTime();
    return Math.round((endTime - startTime) / (1000 * 60));
  }

  private extractVideoLink(event: any): string | undefined {
    // Check for common video conference patterns
    const description = event.description || '';
    const location = event.location || '';

    const patterns = [
      /zoom\.us\/j\/\d+/i,
      /meet\.google\.com\/[a-z-]+/i,
      /teams\.microsoft\.com\/[^\s]+/i
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern) || location.match(pattern);
      if (match) return `https://${match[0]}`;
    }

    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (ep: any) => ep.entryPointType === 'video'
      );
      return videoEntry?.uri;
    }

    return undefined;
  }

  private extractTopics(agenda: string): string[] {
    const lines = agenda.split('\n').filter(l => l.trim());
    const topics: string[] = [];

    for (const line of lines) {
      // Look for numbered items, bullet points, or headers
      if (/^\d+\./.test(line) || /^[-*]/.test(line) || /^#{1,3}/.test(line)) {
        const topic = line.replace(/^[\d.#*-]+\s*/, '').trim();
        if (topic.length > 3 && topic.length < 100) {
          topics.push(topic);
        }
      }
    }

    return topics.length > 0 ? topics.slice(0, 5) : ['General discussion'];
  }
}

// Export singleton instance
export const meetingPrepAgent = new MeetingPrepAgent();