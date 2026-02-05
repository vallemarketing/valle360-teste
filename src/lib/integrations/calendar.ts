// Google Calendar Integration - Valle 360

interface CalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  colorId?: string;
  recurrence?: string[];
  visibility?: 'default' | 'public' | 'private' | 'confidential';
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Cores do Google Calendar
export const CALENDAR_COLORS = {
  '1': '#7986cb', // Lavanda
  '2': '#33b679', // Verde salvia
  '3': '#8e24aa', // Uva
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerina
  '7': '#039be5', // Pavão
  '8': '#616161', // Grafite
  '9': '#3f51b5', // Mirtilo
  '10': '#0b8043', // Manjericão
  '11': '#d50000', // Tomate
};

class GoogleCalendarService {
  private config: CalendarConfig | null = null;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  private getConfig(): CalendarConfig {
    if (!this.config) {
      this.config = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/google/callback'
      };
    }
    return this.config;
  }

  // Gerar URL de autorização
  getAuthUrl(state?: string): string {
    const config = this.getConfig();
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  // Trocar código por tokens
  async exchangeCode(code: string): Promise<{ success: boolean; tokens?: TokenData; error?: string }> {
    const config = this.getConfig();

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri
        })
      });

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error_description || data.error };
      }

      return {
        success: true,
        tokens: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in * 1000)
        }
      };
    } catch (error) {
      console.error('Erro ao trocar código:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Renovar token
  async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; tokens?: TokenData; error?: string }> {
    const config = this.getConfig();

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error_description || data.error };
      }

      return {
        success: true,
        tokens: {
          accessToken: data.access_token,
          refreshToken: refreshToken,
          expiresAt: Date.now() + (data.expires_in * 1000)
        }
      };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Request genérico
  private async request(
    accessToken: string,
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      ...(body && { body: JSON.stringify(body) })
    });

    return response.json();
  }

  // ============================================
  // CALENDARS
  // ============================================

  async listCalendars(accessToken: string) {
    try {
      const data = await this.request(accessToken, '/users/me/calendarList');
      return { success: true, calendars: data.items || [] };
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      return { success: false, error: 'Erro ao listar calendários' };
    }
  }

  async getCalendar(accessToken: string, calendarId: string = 'primary') {
    try {
      const data = await this.request(accessToken, `/calendars/${encodeURIComponent(calendarId)}`);
      return { success: true, calendar: data };
    } catch (error) {
      console.error('Erro ao buscar calendário:', error);
      return { success: false, error: 'Calendário não encontrado' };
    }
  }

  // ============================================
  // EVENTS
  // ============================================

  async listEvents(
    accessToken: string,
    calendarId: string = 'primary',
    options: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
      q?: string;
    } = {}
  ) {
    try {
      const params = new URLSearchParams();
      if (options.timeMin) params.append('timeMin', options.timeMin);
      if (options.timeMax) params.append('timeMax', options.timeMax);
      if (options.maxResults) params.append('maxResults', options.maxResults.toString());
      if (options.singleEvents !== undefined) params.append('singleEvents', options.singleEvents.toString());
      if (options.orderBy) params.append('orderBy', options.orderBy);
      if (options.q) params.append('q', options.q);

      const queryString = params.toString();
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events${queryString ? '?' + queryString : ''}`;
      
      const data = await this.request(accessToken, endpoint);
      return { success: true, events: data.items || [] };
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      return { success: false, error: 'Erro ao listar eventos' };
    }
  }

  async getEvent(accessToken: string, calendarId: string = 'primary', eventId: string) {
    try {
      const data = await this.request(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
      );
      return { success: true, event: data };
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return { success: false, error: 'Evento não encontrado' };
    }
  }

  async createEvent(
    accessToken: string,
    event: CalendarEvent,
    calendarId: string = 'primary',
    sendNotifications: boolean = true
  ) {
    try {
      const params = new URLSearchParams();
      if (sendNotifications) params.append('sendNotifications', 'true');
      if (event.conferenceData) params.append('conferenceDataVersion', '1');

      const queryString = params.toString();
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events${queryString ? '?' + queryString : ''}`;

      const data = await this.request(accessToken, endpoint, 'POST', event);
      
      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, event: data };
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      return { success: false, error: 'Erro ao criar evento' };
    }
  }

  async updateEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary',
    sendNotifications: boolean = true
  ) {
    try {
      const params = new URLSearchParams();
      if (sendNotifications) params.append('sendNotifications', 'true');

      const queryString = params.toString();
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}${queryString ? '?' + queryString : ''}`;

      const data = await this.request(accessToken, endpoint, 'PATCH', event);
      
      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, event: data };
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      return { success: false, error: 'Erro ao atualizar evento' };
    }
  }

  async deleteEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = 'primary',
    sendNotifications: boolean = true
  ) {
    try {
      const params = new URLSearchParams();
      if (sendNotifications) params.append('sendNotifications', 'true');

      const queryString = params.toString();
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}${queryString ? '?' + queryString : ''}`;

      await this.request(accessToken, endpoint, 'DELETE');
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      return { success: false, error: 'Erro ao deletar evento' };
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  // Criar evento de reunião com Google Meet
  async createMeeting(
    accessToken: string,
    summary: string,
    startDateTime: Date,
    durationMinutes: number,
    attendeeEmails: string[],
    description?: string
  ) {
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const event: CalendarEvent = {
      summary,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `valle360-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    return this.createEvent(accessToken, event, 'primary', true);
  }

  // Buscar disponibilidade
  async getFreeBusy(
    accessToken: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ) {
    try {
      const data = await this.request(accessToken, '/freeBusy', 'POST', {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map(id => ({ id }))
      });

      return { success: true, freeBusy: data.calendars };
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return { success: false, error: 'Erro ao buscar disponibilidade' };
    }
  }

  // Criar evento recorrente
  async createRecurringEvent(
    accessToken: string,
    event: CalendarEvent,
    recurrence: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      interval?: number;
      count?: number;
      until?: Date;
      byDay?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
    }
  ) {
    let rrule = `RRULE:FREQ=${recurrence.frequency}`;
    
    if (recurrence.interval) rrule += `;INTERVAL=${recurrence.interval}`;
    if (recurrence.count) rrule += `;COUNT=${recurrence.count}`;
    if (recurrence.until) rrule += `;UNTIL=${recurrence.until.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    if (recurrence.byDay) rrule += `;BYDAY=${recurrence.byDay.join(',')}`;

    event.recurrence = [rrule];

    return this.createEvent(accessToken, event);
  }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;









