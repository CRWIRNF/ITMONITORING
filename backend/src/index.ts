import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import dotenv from 'dotenv';
import pool from './config/database';
import { UserModel } from './models/User';
import { MonitoringDataModel } from './models/MonitoringData';
import { StarlinkHistoryModel } from './models/StarlinkHistory';
import { TicketStatsModel } from './models/TicketStats';
import { FirewallHistoryModel } from './models/FirewallHistory';
import { LoginHistoryModel } from './models/LoginHistory';
import { SystemMetricsModel } from './models/SystemMetrics';
import { starlinkHistoryService } from './services/starlinkHistoryService';
import { WebsiteMonitoringModel } from './models/WebsiteMonitoring';
import { websiteMonitoringService } from './services/websiteMonitoringService';
import { ticketingService } from './services/ticketingService';
import { firewallHistoryService } from './services/firewallHistoryService';
import { systemMetricsService } from './services/systemMetricsService';
import authRoutes from './routes/auth';
import monitoringRoutes from './routes/monitoring';
import starlinkRoutes from './routes/starlink';
import websitesRoutes from './routes/websites';
import ninjaRoutes from './routes/ninja';
import firewallsRoutes from './routes/firewalls';
import versionRoutes from './routes/version';
import usersRoutes from './routes/users';
import systemRoutes from './routes/system';
// import asanaRoutes from './routes/asana';

dotenv.config();

// Validierung kritischer Umgebungsvariablen
const validateEnvironment = () => {
  const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`❌ FEHLER: Fehlende Umgebungsvariablen: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Warnung bei schwachem JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32) {
    console.error('❌ FEHLER: JWT_SECRET muss mindestens 32 Zeichen lang sein!');
    process.exit(1);
  }

  if (jwtSecret.includes('change_this') || jwtSecret.includes('secret_key')) {
    console.error('❌ FEHLER: JWT_SECRET enthält unsichere Standardwerte! Bitte ändern Sie den Secret.');
    process.exit(1);
  }

  // Warnung bei schwachem DB-Passwort in Produktion
  if (process.env.NODE_ENV === 'production' && process.env.DB_PASSWORD === 'postgres') {
    console.error('⚠️  WARNUNG: Verwenden Sie kein Standard-Passwort für die Datenbank in Produktion!');
  }

  console.log('✓ Umgebungsvariablen erfolgreich validiert');
};

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS-Konfiguration mit Whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Erlaubt Requests ohne Origin (z.B. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // In Entwicklung: Erlaube alle Origins vom Port 5173 oder 3000
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes(':5173') || origin.includes(':3000')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting für API-Endpunkte
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Requests pro IP
  message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strengeres Rate Limiting für Auth-Endpunkte
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Login-Versuche
  message: 'Zu viele Login-Versuche, bitte versuchen Sie es in 15 Minuten erneut.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routen (Auth mit strengerem Rate Limiting)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/starlink', starlinkRoutes);
app.use('/api/websites', websitesRoutes);
app.use('/api/ninja', ninjaRoutes);
app.use('/api/firewalls', firewallsRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/system', systemRoutes);
// app.use('/api/asana', asanaRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Datenbank initialisieren
const initDatabase = async () => {
  try {
    console.log('Initialisiere Datenbank...');
    await UserModel.createTable();
    await MonitoringDataModel.createTable();
    await StarlinkHistoryModel.createTable();
    await WebsiteMonitoringModel.createTables();
    await TicketStatsModel.createTable();
    await TicketStatsModel.createMonthlyTable();
    await FirewallHistoryModel.createTable();
    await LoginHistoryModel.createTable();
    await SystemMetricsModel.createTable();
    await UserModel.seedDefaultUsers();
    await MonitoringDataModel.seedDemoData();
    // await WebsiteMonitoringModel.seedDemoWebsites(); // Deaktiviert - echte Websites werden manuell konfiguriert
    console.log('✓ Datenbank erfolgreich initialisiert');
  } catch (error) {
    console.error('Fehler bei der Datenbank-Initialisierung:', error);
    process.exit(1);
  }
};

// Starlink Historie initialisieren
const initStarlinkHistory = async () => {
  try {
    // Prüfe ob bereits Daten vorhanden sind
    const oldestEntry = await StarlinkHistoryModel.getOldestEntry();

    if (!oldestEntry) {
      console.log('\nInitialer Starlink-Daten-Import...');
      await starlinkHistoryService.importCurrentData();
    }
  } catch (error) {
    console.error('Fehler beim initialen Starlink-Import:', error);
    // Nicht beenden, da dies kein kritischer Fehler ist
  }
};

// Täglicher Scheduler für Starlink-Daten-Update
const scheduleStarlinkUpdates = () => {
  // Führe Update bei Server-Start aus (nach 10 Sekunden)
  setTimeout(async () => {
    try {
      console.log('🔄 Initialer Starlink-Update beim Server-Start...');
      await starlinkHistoryService.updateHistory();
    } catch (error) {
      console.error('❌ Fehler beim initialen Starlink-Update:', error);
    }
  }, 10000);

  // Täglicher Cron-Job: Jeden Tag um 3:00 Uhr morgens
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('\n🔄 Täglicher Starlink-Update gestartet (3:00 Uhr)...');
      await starlinkHistoryService.updateHistory();
    } catch (error) {
      console.error('❌ Fehler beim täglichen Starlink-Update:', error);
    }
  }, {
    timezone: 'Europe/Berlin'
  });

  console.log('✓ Starlink-Update-Scheduler konfiguriert:');
  console.log('  - Initial: 10 Sekunden nach Server-Start');
  console.log('  - Wiederkehrend: Täglich um 3:00 Uhr (Europe/Berlin)');
};

// Website-Monitoring Scheduler
const scheduleWebsiteChecks = () => {
  // Initial check nach 5 Sekunden
  setTimeout(() => websiteMonitoringService.checkAllWebsites(), 5000);

  // Alle 5 Minuten prüfen
  setInterval(() => websiteMonitoringService.checkAllWebsites(), 5 * 60 * 1000);

  console.log('✓ Website-Monitoring-Scheduler konfiguriert (alle 5 Minuten)');
};

// Ticket-Stats Scheduler
const scheduleTicketStatsSnapshots = () => {
  // Snapshot-Funktion
  const saveSnapshot = async () => {
    try {
      console.log('🔄 Sammle Ticket-Statistiken von NinjaOne...');
      const [stats, creationStats, closureStats] = await Promise.all([
        ticketingService.getTicketingStats(),
        ticketingService.getTicketCreationStats(),
        ticketingService.getTicketClosureStats()
      ]);

      await TicketStatsModel.saveSnapshot({
        totalTickets: stats.totalTickets,
        openTickets: stats.openTickets,
        closedTickets: stats.closedTickets,
        unassignedTickets: stats.unassignedTickets,
        creationStats,
        closureStats
      });
      console.log('✓ Ticket-Statistik-Snapshot gespeichert (inkl. Creation/Closure Stats)');
    } catch (error) {
      console.error('Fehler beim Speichern des Ticket-Snapshots:', error);
    }
  };

  // Initial snapshot nach 15 Sekunden
  setTimeout(saveSnapshot, 15000);

  // Alle 30 Minuten einen Snapshot speichern
  setInterval(saveSnapshot, 30 * 60 * 1000);

  // Alte Snapshots täglich um 4:00 Uhr aufräumen
  setInterval(() => TicketStatsModel.cleanupOldSnapshots(), 24 * 60 * 60 * 1000);

  console.log('✓ Ticket-Stats-Scheduler konfiguriert (alle 30 Minuten)');
};

// Firewall-Historie Scheduler
const scheduleFirewallDataCollection = () => {
  // Firewall IPs aus Umgebungsvariablen laden
  const firewallIpsEnv = process.env.FIREWALL_IPS || '';
  const FIREWALL_IPS = firewallIpsEnv
    ? firewallIpsEnv.split(',').map(ip => ip.trim())
    : [
        '10.50.149.254',
        '10.64.149.254',
        '10.66.149.254',
        '10.67.149.254',
        '10.68.149.254',
        '10.69.149.254',
        '10.72.149.254'
      ];

  if (!firewallIpsEnv) {
    console.log('⚠️  WARNUNG: FIREWALL_IPS nicht in .env definiert, verwende Standardwerte');
  }

  // Datensammlung nach 20 Sekunden starten
  setTimeout(() => firewallHistoryService.collectAndSaveData(FIREWALL_IPS), 20000);

  // Alle 5 Minuten Daten sammeln
  setInterval(() => firewallHistoryService.collectAndSaveData(FIREWALL_IPS), 5 * 60 * 1000);

  // Alte Daten täglich um 5:00 Uhr aufräumen
  setInterval(() => firewallHistoryService.cleanupOldData(), 24 * 60 * 60 * 1000);

  console.log('✓ Firewall-Historie-Scheduler konfiguriert (alle 5 Minuten)');
};

// System-Metriken Scheduler
const scheduleSystemMetricsCollection = () => {
  // Datensammlung nach 5 Sekunden starten
  setTimeout(() => systemMetricsService.collectAndSaveMetrics(), 5000);

  // Alle 5 Minuten Metriken sammeln
  setInterval(() => systemMetricsService.collectAndSaveMetrics(), 5 * 60 * 1000);

  // Alte Daten täglich um 6:00 Uhr aufräumen (älter als 7 Tage)
  cron.schedule('0 6 * * *', async () => {
    await systemMetricsService.cleanupOldMetrics();
  }, {
    timezone: 'Europe/Berlin'
  });

  // Login-Historie täglich um 6:30 Uhr aufräumen (älter als 90 Tage)
  cron.schedule('30 6 * * *', async () => {
    try {
      await LoginHistoryModel.cleanupOldEntries();
      console.log('✓ Alte Login-Historie aufgeräumt');
    } catch (error) {
      console.error('Fehler beim Aufräumen der Login-Historie:', error);
    }
  }, {
    timezone: 'Europe/Berlin'
  });

  console.log('✓ System-Metriken-Scheduler konfiguriert (alle 5 Minuten)');
};

// Ticket Monthly Aggregation Scheduler
const scheduleTicketMonthlyAggregation = () => {
  // Backfill beim Start (30s Verzögerung)
  setTimeout(async () => {
    try {
      console.log('🔄 Backfilling ticket monthly stats...');
      const availableMonths = await TicketStatsModel.getAvailableSnapshotMonths();
      for (const { year, month } of availableMonths) {
        await TicketStatsModel.aggregateMonth(year, month);
      }
      console.log(`✓ Backfill abgeschlossen: ${availableMonths.length} Monate aggregiert`);
    } catch (error) {
      console.error('Fehler beim Backfill der monatlichen Ticket-Stats:', error);
    }
  }, 30000);

  // Monatlich am 1. um 01:00 Uhr: Vormonat aggregieren
  cron.schedule('0 1 1 * *', async () => {
    try {
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() ist 0-basiert, der aktuelle Monat ist schon der neue
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      console.log(`🔄 Aggregiere Ticket-Stats für ${prevMonth}/${prevYear}...`);
      await TicketStatsModel.aggregateMonth(prevYear, prevMonth);
      console.log(`✓ Monatliche Ticket-Aggregation abgeschlossen: ${prevMonth}/${prevYear}`);
    } catch (error) {
      console.error('Fehler bei monatlicher Ticket-Aggregation:', error);
    }
  }, {
    timezone: 'Europe/Berlin'
  });

  // Stündlich: Laufenden Monat aktualisieren
  setInterval(async () => {
    try {
      const now = new Date();
      await TicketStatsModel.aggregateMonth(now.getFullYear(), now.getMonth() + 1);
    } catch (error) {
      console.error('Fehler bei stündlicher Ticket-Monats-Aktualisierung:', error);
    }
  }, 60 * 60 * 1000);

  console.log('✓ Ticket monthly aggregation scheduler configured');
};

// Server starten
const startServer = async () => {
  try {
    validateEnvironment();
    await initDatabase();
    await initStarlinkHistory();

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`🚀 Server läuft auf Port ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log(`========================================\n`);
      console.log(`Standard-Zugangsdaten:`);
      console.log(`Admin: admin@monitoring.local / admin123`);
      console.log(`User:  user@monitoring.local / user123`);
      console.log(`========================================\n`);

      // Starte Scheduler
      scheduleStarlinkUpdates();
      scheduleWebsiteChecks();
      scheduleTicketStatsSnapshots();
      scheduleFirewallDataCollection();
      scheduleSystemMetricsCollection();
      scheduleTicketMonthlyAggregation();
    });
  } catch (error) {
    console.error('Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, fahre Server herunter...');
  await pool.end();
  process.exit(0);
});
