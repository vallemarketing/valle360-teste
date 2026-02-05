/**
 * Google Calendar Integration
 * For scheduling meetings and reminders
 */

import { google, calendar_v3 } from 'googleapis';

// Types
export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  conferenceData?: boolean; // Create Google Meet link
  reminders?: {
    email?: number; // minutes before
    popup?: number; // minutes before
  };
  colorId?: string;
  recurrence?: string[]; // RRULE format
}

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  meetLink?: string;
  error?: string;
}

// OAuth2 client
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  return oauth2Client;
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || '',
    expiryDate: tokens.expiry_date || 0,
  };
}

/**
 * Create authenticated calendar client
 */
function getCalendarClient(accessToken: string, refreshToken?: string): calendar_v3.Calendar {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event
 */
export async function createEvent(
  accessToken: string,
  refreshToken: string | undefined,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<CreateEventResult> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    
    const eventBody: calendar_v3.Schema$Event = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: event.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          ...(event.reminders?.email ? [{ method: 'email' as const, minutes: event.reminders.email }] : []),
          ...(event.reminders?.popup ? [{ method: 'popup' as const, minutes: event.reminders.popup }] : []),
        ],
      },
      recurrence: event.recurrence,
      colorId: event.colorId,
    };

    // Add conference data (Google Meet) if requested
    if (event.conferenceData) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `valle360-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
      conferenceDataVersion: event.conferenceData ? 1 : undefined,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      htmlLink: response.data.htmlLink || undefined,
      meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || undefined,
    };
  } catch (error: any) {
    console.error('Google Calendar create event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create event',
    };
  }
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventId: string,
  updates: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CreateEventResult> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    
    const eventBody: calendar_v3.Schema$Event = {};
    
    if (updates.summary) eventBody.summary = updates.summary;
    if (updates.description) eventBody.description = updates.description;
    if (updates.location) eventBody.location = updates.location;
    if (updates.start) {
      eventBody.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
    }
    if (updates.end) {
      eventBody.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
    }
    if (updates.attendees) {
      eventBody.attendees = updates.attendees.map(email => ({ email }));
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventBody,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      htmlLink: response.data.htmlLink || undefined,
    };
  } catch (error: any) {
    console.error('Google Calendar update event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update event',
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventId: string,
  calendarId: string = 'primary'
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Google Calendar delete event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete event',
    };
  }
}

/**
 * List calendar events
 */
export async function listEvents(
  accessToken: string,
  refreshToken: string | undefined,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
    query?: string;
  } = {},
  calendarId: string = 'primary'
): Promise<{ success: boolean; events?: any[]; error?: string }> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: (options.timeMin || new Date()).toISOString(),
      timeMax: options.timeMax?.toISOString(),
      maxResults: options.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
      q: options.query,
    });

    return {
      success: true,
      events: response.data.items?.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        htmlLink: event.htmlLink,
        meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
        attendees: event.attendees?.map(a => ({
          email: a.email,
          responseStatus: a.responseStatus,
        })),
        status: event.status,
      })),
    };
  } catch (error: any) {
    console.error('Google Calendar list events error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list events',
    };
  }
}

/**
 * Create a meeting event (helper)
 */
export async function scheduleMeeting(
  accessToken: string,
  refreshToken: string | undefined,
  options: {
    title: string;
    description?: string;
    startTime: Date;
    durationMinutes: number;
    attendees: string[];
    createMeetLink?: boolean;
  }
): Promise<CreateEventResult> {
  const endTime = new Date(options.startTime.getTime() + options.durationMinutes * 60 * 1000);
  
  return createEvent(accessToken, refreshToken, {
    summary: options.title,
    description: options.description,
    start: options.startTime,
    end: endTime,
    attendees: options.attendees,
    conferenceData: options.createMeetLink !== false,
    reminders: {
      email: 60, // 1 hour before
      popup: 15, // 15 minutes before
    },
  });
}

/**
 * Pre-defined meeting templates
 */
export const MeetingTemplates = {
  kickoff: (clientName: string, attendees: string[]): Partial<CalendarEvent> => ({
    summary: `Kickoff - ${clientName}`,
    description: `Reunião de kickoff com ${clientName}.\n\n**Pauta:**\n- Apresentação da equipe\n- Entendimento do projeto\n- Definição de objetivos\n- Próximos passos\n\n_Valle 360_`,
    attendees,
    conferenceData: true,
    reminders: { email: 60, popup: 15 },
  }),

  monthly: (clientName: string, attendees: string[]): Partial<CalendarEvent> => ({
    summary: `Reunião Mensal - ${clientName}`,
    description: `Reunião mensal de acompanhamento com ${clientName}.\n\n**Pauta:**\n- Revisão de métricas\n- Apresentação de resultados\n- Planejamento do próximo mês\n- Feedbacks\n\n_Valle 360_`,
    attendees,
    conferenceData: true,
    reminders: { email: 60, popup: 15 },
  }),

  strategy: (clientName: string, attendees: string[]): Partial<CalendarEvent> => ({
    summary: `Reunião de Estratégia - ${clientName}`,
    description: `Reunião estratégica com ${clientName}.\n\n**Pauta:**\n- Análise de mercado\n- Revisão de posicionamento\n- Planejamento de campanhas\n- Definição de metas\n\n_Valle 360_`,
    attendees,
    conferenceData: true,
    reminders: { email: 60, popup: 15 },
  }),

  approval: (clientName: string, contentTitle: string, attendees: string[]): Partial<CalendarEvent> => ({
    summary: `Aprovação de Conteúdo - ${clientName}`,
    description: `Apresentação e aprovação de conteúdo.\n\n**Conteúdo:** ${contentTitle}\n\n_Valle 360_`,
    attendees,
    conferenceData: true,
    reminders: { email: 30, popup: 10 },
  }),
};
