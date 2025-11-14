import { CalendarIntegration, CalendarEvent, iCalConfig, ScheduleEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Google Calendar Service
export const googleCalendarService = {
  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/calendar/google/auth-url`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Google auth URL');
    }

    const data = await response.json();
    return data.authUrl;
  },

  async handleCallback(code: string): Promise<CalendarIntegration> {
    const response = await fetch(`${API_BASE_URL}/calendar/google/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to complete Google OAuth');
    }

    const data = await response.json();
    return data.integration;
  },

  async disconnect(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/google/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Google Calendar');
    }
  },

  async fetchEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
    const response = await fetch(
      `${API_BASE_URL}/calendar/google/events?from=${from.toISOString()}&to=${to.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    return data.events;
  },

  async syncEvent(event: ScheduleEvent): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/google/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ event })
    });

    if (!response.ok) {
      throw new Error('Failed to sync event to Google Calendar');
    }
  },

  async getIntegration(): Promise<CalendarIntegration | null> {
    const response = await fetch(`${API_BASE_URL}/calendar/google/integration`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get Google Calendar integration');
    }

    const data = await response.json();
    return data.integration;
  }
};

// iCal/CalDAV Service
export const iCalService = {
  async connect(config: iCalConfig): Promise<CalendarIntegration> {
    const response = await fetch(`${API_BASE_URL}/calendar/ical/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to connect to iCal server');
    }

    const data = await response.json();
    return data.integration;
  },

  async disconnect(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/ical/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect iCal');
    }
  },

  async fetchEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
    const response = await fetch(
      `${API_BASE_URL}/calendar/ical/events?from=${from.toISOString()}&to=${to.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch iCal events');
    }

    const data = await response.json();
    return data.events;
  },

  async syncEvent(event: ScheduleEvent): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/ical/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ event })
    });

    if (!response.ok) {
      throw new Error('Failed to sync event to iCal');
    }
  },

  async getIntegration(): Promise<CalendarIntegration | null> {
    const response = await fetch(`${API_BASE_URL}/calendar/ical/integration`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get iCal integration');
    }

    const data = await response.json();
    return data.integration;
  }
};

// Get all integrations
export const getAllIntegrations = async (): Promise<CalendarIntegration[]> => {
  const response = await fetch(`${API_BASE_URL}/calendar/integrations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get calendar integrations');
  }

  const data = await response.json();
  return data.integrations;
};

// Sync all events from all calendars
export const syncAllEvents = async (from: Date, to: Date): Promise<CalendarEvent[]> => {
  const allEvents: CalendarEvent[] = [];

  try {
    const googleEvents = await googleCalendarService.fetchEvents(from, to);
    allEvents.push(...googleEvents);
  } catch (error) {
    console.error('Failed to fetch Google events:', error);
  }

  try {
    const iCalEvents = await iCalService.fetchEvents(from, to);
    allEvents.push(...iCalEvents);
  } catch (error) {
    console.error('Failed to fetch iCal events:', error);
  }

  return allEvents;
};
