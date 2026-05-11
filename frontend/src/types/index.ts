export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MonitoringEntry {
  id: number;
  service_type: 'starlink' | 'ticketsystem' | 'firewall' | 'website';
  service_name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  response_time?: number;
  last_check: string;
  details?: any;
}

export interface DashboardSummary {
  service_type: string;
  total_services: number;
  online: number;
  offline: number;
  warning: number;
  error: number;
  avg_response_time: number;
}

export interface TicketBoard {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  system: boolean;
  ticketCount: number;
}

export interface TicketCreationStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
}

export interface TicketClosureStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
}

export interface TicketTrendEntry {
  period: string;
  label: string;
  total: number;
  open: number;
  created: number;
  closed: number;
}

export interface TicketCreatorEntry {
  name: string;
  count: number;
}

export interface TicketMonthlyHistoryEntry {
  period: string;
  year: number;
  month: number;
  label: string;
  count: number;
}

export interface TicketWeeklyHistoryEntry {
  period: string;
  isoYear: number;
  isoWeek: number;
  label: string;
  rangeLabel: string;
  count: number;
}

export interface TicketHistory {
  monthly: TicketMonthlyHistoryEntry[];
  weekly: TicketWeeklyHistoryEntry[];
  totalTickets: number;
  oldestTicketDate: string | null;
  newestTicketDate: string | null;
}

export interface TicketingData {
  service_type: string;
  service_name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details: {
    total: number;
    open: number;
    closed: number;
    unassigned: number;
    myTickets: number;
    boards: TicketBoard[];
    creationStats: TicketCreationStats;
    closureStats: TicketClosureStats;
  };
}
