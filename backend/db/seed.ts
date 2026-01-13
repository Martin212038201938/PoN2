/**
 * PoN2 Database Seed Script
 *
 * Creates demo users and sample data for showcasing the application.
 *
 * Usage: npm run db:seed (from backend directory)
 * Or: npx tsx db/seed.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPaths = [
  path.join(process.cwd(), 'backend', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded .env from: ${envPath}`);
    break;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set!');
  process.exit(1);
}

// Import schema
import * as schema from '../src/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

// Helper to generate IDs
const generateId = createId;

async function seed() {
  console.log('Starting database seed...\n');

  try {
    // ========================================================================
    // 1. CREATE DEMO USERS
    // ========================================================================
    console.log('Creating demo users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminId = generateId();
    const detectiveId = generateId();
    const detective2Id = generateId();

    // Check if users already exist
    const existingUsers = await db.select().from(schema.users);

    if (existingUsers.length === 0) {
      await db.insert(schema.users).values([
        {
          id: adminId,
          email: 'admin@pon2.de',
          password: hashedPassword,
          firstName: 'Max',
          lastName: 'Administrator',
          role: 'ADMIN',
          isActive: true,
        },
        {
          id: detectiveId,
          email: 'detective@pon2.de',
          password: hashedPassword,
          firstName: 'Anna',
          lastName: 'Ermittler',
          role: 'DETECTIVE',
          isActive: true,
        },
        {
          id: detective2Id,
          email: 'detective2@pon2.de',
          password: hashedPassword,
          firstName: 'Thomas',
          lastName: 'Meier',
          role: 'DETECTIVE',
          isActive: true,
        },
      ]);
      console.log('  Created 3 demo users');
    } else {
      console.log(`  Users already exist (${existingUsers.length}), using existing admin/detective`);
      // Use first admin and detective found
      const admin = existingUsers.find(u => u.role === 'ADMIN');
      const detective = existingUsers.find(u => u.role === 'DETECTIVE');
      if (admin) Object.assign({ adminId: admin.id });
      if (detective) Object.assign({ detectiveId: detective.id });
    }

    // Get the actual user IDs (either created or existing)
    const users = await db.select().from(schema.users);
    const adminUser = users.find(u => u.email === 'admin@pon2.de') || users.find(u => u.role === 'ADMIN');
    const detectiveUser = users.find(u => u.email === 'detective@pon2.de') || users.find(u => u.role === 'DETECTIVE');

    if (!adminUser || !detectiveUser) {
      throw new Error('Could not find or create demo users');
    }

    // ========================================================================
    // 2. CREATE SAMPLE CASES
    // ========================================================================
    console.log('\nCreating sample cases...');

    const existingCases = await db.select().from(schema.cases);

    if (existingCases.length === 0) {
      const case1Id = generateId();
      const case2Id = generateId();
      const case3Id = generateId();
      const case4Id = generateId();
      const case5Id = generateId();

      await db.insert(schema.cases).values([
        {
          id: case1Id,
          caseNumber: 'ERB-2024-001',
          deceasedFirstName: 'Heinrich',
          deceasedLastName: 'Müller',
          deceasedBirthDate: new Date('1942-03-15'),
          deceasedDeathDate: new Date('2024-01-10'),
          birthPlace: 'Hamburg',
          deathPlace: 'München',
          status: 'IN_RESEARCH',
          court: 'Amtsgericht München',
          estateValue: '250000.00',
          threshold: '50000.00',
          sourceType: 'RECHTSPFLEGER',
          sourceReference: 'Az. 123/2024',
          originalText: 'Nachlassakte Müller, Heinrich. Erbenermittlung erforderlich. Keine bekannten Angehörigen.',
          budgetEur: '500.00',
          maxApiCallsPerSource: 100,
          currentSpentEur: '45.50',
          successProbability: '65.00',
          researchWaveCount: 2,
          notes: 'Erblasser war kinderlos verheiratet, Ehefrau verstorben 2020. Geschwister werden gesucht.',
          createdById: detectiveUser.id,
          assignedToId: detectiveUser.id,
        },
        {
          id: case2Id,
          caseNumber: 'ERB-2024-002',
          deceasedFirstName: 'Margarete',
          deceasedLastName: 'Schmidt',
          deceasedBirthDate: new Date('1935-08-22'),
          deceasedDeathDate: new Date('2024-02-05'),
          birthPlace: 'Berlin',
          deathPlace: 'Berlin',
          status: 'HEIRS_IDENTIFIED',
          court: 'Amtsgericht Berlin-Charlottenburg',
          estateValue: '180000.00',
          threshold: '30000.00',
          sourceType: 'RECHTSPFLEGER',
          sourceReference: 'Az. 456/2024',
          originalText: 'Nachlassakte Schmidt. Erben 2. Ordnung zu ermitteln.',
          budgetEur: '300.00',
          maxApiCallsPerSource: 50,
          currentSpentEur: '120.75',
          successProbability: '85.00',
          researchWaveCount: 3,
          notes: '3 potentielle Erben identifiziert, Kontaktaufnahme läuft.',
          resultSummary: 'Zwei Neffen und eine Nichte als Erben 2. Ordnung identifiziert.',
          createdById: detectiveUser.id,
          assignedToId: detectiveUser.id,
        },
        {
          id: case3Id,
          caseNumber: 'ERB-2024-003',
          deceasedFirstName: 'Wilhelm',
          deceasedLastName: 'Fischer',
          deceasedBirthDate: new Date('1950-11-30'),
          deceasedDeathDate: new Date('2024-03-18'),
          birthPlace: 'Köln',
          deathPlace: 'Düsseldorf',
          status: 'NEW',
          court: 'Amtsgericht Düsseldorf',
          estateValue: '95000.00',
          threshold: '20000.00',
          sourceType: 'ANWALT',
          sourceReference: 'Kanzlei Weber & Partner',
          originalText: 'Mandant verstorben, Testament ungültig, gesetzliche Erben zu ermitteln.',
          budgetEur: '200.00',
          maxApiCallsPerSource: 30,
          currentSpentEur: '0.00',
          successProbability: null,
          researchWaveCount: 0,
          notes: 'Neuer Fall, Recherche noch nicht begonnen.',
          createdById: adminUser.id,
          assignedToId: null,
        },
        {
          id: case4Id,
          caseNumber: 'ERB-2023-089',
          deceasedFirstName: 'Erika',
          deceasedLastName: 'Wagner',
          deceasedBirthDate: new Date('1928-05-12'),
          deceasedDeathDate: new Date('2023-11-20'),
          birthPlace: 'Frankfurt am Main',
          deathPlace: 'Frankfurt am Main',
          status: 'SUCCESSFULLY_SOLVED',
          court: 'Amtsgericht Frankfurt',
          estateValue: '420000.00',
          threshold: '80000.00',
          sourceType: 'RECHTSPFLEGER',
          sourceReference: 'Az. 789/2023',
          originalText: 'Großer Nachlass, keine bekannten Erben.',
          budgetEur: '800.00',
          maxApiCallsPerSource: 150,
          currentSpentEur: '340.25',
          successProbability: '100.00',
          researchWaveCount: 5,
          notes: 'Komplexer Fall mit internationaler Recherche.',
          resultSummary: 'Großnichte in Australien als einzige Erbin identifiziert. Erbschein beantragt.',
          closedAt: new Date('2024-01-15'),
          createdById: detectiveUser.id,
          assignedToId: detectiveUser.id,
        },
        {
          id: case5Id,
          caseNumber: 'ERB-2023-102',
          deceasedFirstName: 'Kurt',
          deceasedLastName: 'Bauer',
          deceasedBirthDate: new Date('1955-02-28'),
          deceasedDeathDate: new Date('2023-12-01'),
          birthPlace: 'Stuttgart',
          deathPlace: 'Stuttgart',
          status: 'CLOSED_WITHOUT_SUCCESS',
          court: 'Amtsgericht Stuttgart',
          estateValue: '35000.00',
          threshold: '10000.00',
          sourceType: 'RECHTSPFLEGER',
          sourceReference: 'Az. 234/2023',
          originalText: 'Kleine Erbschaft, Erbenermittlung erforderlich.',
          budgetEur: '100.00',
          maxApiCallsPerSource: 20,
          currentSpentEur: '98.50',
          successProbability: '0.00',
          researchWaveCount: 2,
          notes: 'Budget erschöpft ohne Erfolg.',
          resultSummary: 'Keine Erben ermittelt. Fiskus erbt.',
          closedAt: new Date('2024-02-01'),
          createdById: adminUser.id,
          assignedToId: detectiveUser.id,
        },
      ]);
      console.log('  Created 5 sample cases');

      // ========================================================================
      // 3. CREATE SAMPLE PERSONS
      // ========================================================================
      console.log('\nCreating sample persons...');

      const person1Id = generateId();
      const person2Id = generateId();
      const person3Id = generateId();
      const person4Id = generateId();
      const person5Id = generateId();
      const person6Id = generateId();

      await db.insert(schema.persons).values([
        {
          id: person1Id,
          firstName: 'Hans',
          lastName: 'Müller',
          birthDate: new Date('1945-06-20'),
          birthPlace: 'Hamburg',
          gender: 'male',
          notes: 'Bruder des Erblassers Heinrich Müller. Lebt möglicherweise noch.',
        },
        {
          id: person2Id,
          firstName: 'Gisela',
          lastName: 'Müller',
          birthDate: new Date('1948-09-10'),
          deathDate: new Date('2015-04-22'),
          birthPlace: 'Hamburg',
          deathPlace: 'Bremen',
          gender: 'female',
          notes: 'Schwester des Erblassers, verstorben.',
        },
        {
          id: person3Id,
          firstName: 'Peter',
          lastName: 'Schmidt',
          birthDate: new Date('1960-03-15'),
          birthPlace: 'Berlin',
          gender: 'male',
          notes: 'Neffe der Erblasserin Margarete Schmidt (Sohn des Bruders).',
        },
        {
          id: person4Id,
          firstName: 'Sabine',
          lastName: 'Schmidt-Weber',
          birthDate: new Date('1965-07-08'),
          birthPlace: 'Berlin',
          gender: 'female',
          notes: 'Nichte der Erblasserin, verheiratet.',
        },
        {
          id: person5Id,
          firstName: 'Michael',
          lastName: 'Schmidt',
          birthDate: new Date('1962-11-25'),
          birthPlace: 'Potsdam',
          gender: 'male',
          notes: 'Zweiter Neffe der Erblasserin.',
        },
        {
          id: person6Id,
          firstName: 'Jennifer',
          lastName: 'Wagner-Smith',
          birthDate: new Date('1985-02-14'),
          birthPlace: 'Sydney, Australien',
          gender: 'female',
          notes: 'Großnichte von Erika Wagner. Lebt in Melbourne.',
        },
      ]);
      console.log('  Created 6 sample persons');

      // ========================================================================
      // 4. LINK PERSONS TO CASES
      // ========================================================================
      console.log('\nLinking persons to cases...');

      await db.insert(schema.personCases).values([
        // Case 1: Müller - Geschwister des Erblassers
        {
          id: generateId(),
          personId: person1Id,
          caseId: case1Id,
          role: 'POTENTIAL_HEIR',
          heirProbability: '75.00',
          reasoning: 'Bruder des Erblassers, Erbe 2. Ordnung falls lebend.',
        },
        {
          id: generateId(),
          personId: person2Id,
          caseId: case1Id,
          role: 'RELATIVE',
          heirProbability: '0.00',
          reasoning: 'Schwester des Erblassers, bereits verstorben. Kinder prüfen!',
        },
        // Case 2: Schmidt - Neffen/Nichten
        {
          id: generateId(),
          personId: person3Id,
          caseId: case2Id,
          role: 'POTENTIAL_HEIR',
          heirProbability: '90.00',
          reasoning: 'Neffe, Erbe 2. Ordnung, Kontakt hergestellt.',
        },
        {
          id: generateId(),
          personId: person4Id,
          caseId: case2Id,
          role: 'POTENTIAL_HEIR',
          heirProbability: '90.00',
          reasoning: 'Nichte, Erbe 2. Ordnung, Adresse verifiziert.',
        },
        {
          id: generateId(),
          personId: person5Id,
          caseId: case2Id,
          role: 'POTENTIAL_HEIR',
          heirProbability: '85.00',
          reasoning: 'Neffe, Erbe 2. Ordnung, weitere Verifizierung nötig.',
        },
        // Case 4: Wagner - Großnichte (gelöster Fall)
        {
          id: generateId(),
          personId: person6Id,
          caseId: case4Id,
          role: 'POTENTIAL_HEIR',
          heirProbability: '100.00',
          reasoning: 'Einzige lebende Verwandte, Erbin nach AUS-Recht bestätigt.',
        },
      ]);
      console.log('  Created 6 person-case links');

      // ========================================================================
      // 5. CREATE SAMPLE CONTACT INFOS
      // ========================================================================
      console.log('\nCreating sample contact information...');

      await db.insert(schema.contactInfos).values([
        {
          id: generateId(),
          type: 'ADDRESS',
          value: 'Musterstraße 42, 22765 Hamburg',
          label: 'Letzte bekannte Adresse',
          isVerified: false,
          trustScore: '60.00',
          personId: person1Id,
        },
        {
          id: generateId(),
          type: 'EMAIL',
          value: 'peter.schmidt@example.de',
          label: 'Privat',
          isVerified: true,
          trustScore: '95.00',
          personId: person3Id,
        },
        {
          id: generateId(),
          type: 'PHONE',
          value: '+49 30 12345678',
          label: 'Festnetz',
          isVerified: true,
          trustScore: '90.00',
          personId: person3Id,
        },
        {
          id: generateId(),
          type: 'ADDRESS',
          value: 'Berliner Allee 15, 10178 Berlin',
          label: 'Wohnadresse',
          isVerified: true,
          trustScore: '95.00',
          personId: person4Id,
        },
        {
          id: generateId(),
          type: 'EMAIL',
          value: 'jenny.wagnersmith@gmail.com',
          label: 'Privat',
          isVerified: true,
          trustScore: '100.00',
          personId: person6Id,
        },
        {
          id: generateId(),
          type: 'ADDRESS',
          value: '123 Collins Street, Melbourne VIC 3000, Australia',
          label: 'Wohnadresse',
          isVerified: true,
          trustScore: '100.00',
          personId: person6Id,
        },
      ]);
      console.log('  Created 6 contact infos');

      // ========================================================================
      // 6. CREATE SAMPLE RELATIONSHIPS
      // ========================================================================
      console.log('\nCreating sample relationships...');

      await db.insert(schema.relationships).values([
        {
          id: generateId(),
          type: 'SIBLING',
          fromPersonId: person1Id,
          toPersonId: person2Id,
          trustScore: '90.00',
          description: 'Geschwister (Heinrich Müller)',
        },
        {
          id: generateId(),
          type: 'SIBLING',
          fromPersonId: person3Id,
          toPersonId: person4Id,
          trustScore: '95.00',
          description: 'Geschwister',
        },
        {
          id: generateId(),
          type: 'SIBLING',
          fromPersonId: person3Id,
          toPersonId: person5Id,
          trustScore: '95.00',
          description: 'Geschwister',
        },
      ]);
      console.log('  Created 3 relationships');

      // ========================================================================
      // 7. CREATE SAMPLE RESEARCH WAVES
      // ========================================================================
      console.log('\nCreating sample research waves...');

      const wave1Id = generateId();
      const wave2Id = generateId();

      await db.insert(schema.researchWaves).values([
        {
          id: wave1Id,
          waveNumber: 1,
          status: 'COMPLETED',
          maxBudgetEur: '100.00',
          actualCostEur: '35.50',
          artifactsFound: 8,
          personsFound: 2,
          notes: 'Erste Recherchewelle: Standesamt-Anfragen und Genealogie-Datenbanken.',
          caseId: case1Id,
          startedAt: new Date('2024-01-15'),
          completedAt: new Date('2024-01-18'),
        },
        {
          id: wave2Id,
          waveNumber: 2,
          status: 'IN_PROGRESS',
          maxBudgetEur: '150.00',
          actualCostEur: '10.00',
          artifactsFound: 3,
          personsFound: 0,
          notes: 'Zweite Welle: Vertiefte Suche nach Bruder Hans Müller.',
          caseId: case1Id,
          startedAt: new Date('2024-01-20'),
        },
      ]);
      console.log('  Created 2 research waves');

      // ========================================================================
      // 8. CREATE SAMPLE RESEARCH ARTIFACTS
      // ========================================================================
      console.log('\nCreating sample research artifacts...');

      await db.insert(schema.researchArtifacts).values([
        {
          id: generateId(),
          type: 'GENEALOGY_SEARCH',
          source: 'Ancestry.de',
          sourceUrl: 'https://www.ancestry.de/search/...',
          rawText: 'Heinrich Müller, geb. 15.03.1942 Hamburg. Eltern: Wilhelm Müller und Martha Müller geb. Schulz. Geschwister: Hans (geb. 1945), Gisela (geb. 1948).',
          structuredData: JSON.stringify({
            name: 'Heinrich Müller',
            birthDate: '1942-03-15',
            birthPlace: 'Hamburg',
            siblings: ['Hans Müller', 'Gisela Müller'],
          }),
          relevanceScore: '95.00',
          trustScore: '85.00',
          apiCost: '2.50',
          caseId: case1Id,
          researchWaveId: wave1Id,
        },
        {
          id: generateId(),
          type: 'PUBLIC_RECORD',
          source: 'Standesamt Hamburg',
          rawText: 'Geburtsurkunde Hans Müller, geboren 20.06.1945 in Hamburg. Vater: Wilhelm Müller, Mutter: Martha Müller geb. Schulz.',
          structuredData: JSON.stringify({
            documentType: 'Geburtsurkunde',
            name: 'Hans Müller',
            birthDate: '1945-06-20',
          }),
          relevanceScore: '100.00',
          trustScore: '100.00',
          apiCost: '15.00',
          caseId: case1Id,
          researchWaveId: wave1Id,
        },
        {
          id: generateId(),
          type: 'WEB_SEARCH',
          source: 'Google Search',
          rawText: 'Hans Müller Hamburg - Mehrere Treffer in Telefonbüchern und sozialen Netzwerken gefunden.',
          relevanceScore: '60.00',
          trustScore: '40.00',
          apiCost: '0.50',
          caseId: case1Id,
          researchWaveId: wave2Id,
        },
        {
          id: generateId(),
          type: 'PERPLEXITY_RESEARCH',
          source: 'Perplexity AI',
          rawText: 'Recherche zu Erbschaftsrecht 2. Ordnung: Nach § 1925 BGB sind die Eltern des Erblassers und deren Abkömmlinge Erben der zweiten Ordnung. Bei kinderlosem Erblasser ohne Eltern erben die Geschwister zu gleichen Teilen.',
          relevanceScore: '80.00',
          trustScore: '90.00',
          apiCost: '1.20',
          caseId: case1Id,
          researchWaveId: wave1Id,
        },
        {
          id: generateId(),
          type: 'GENEALOGY_SEARCH',
          source: 'MyHeritage',
          rawText: 'Schmidt Familie Berlin: Margarete Schmidt (1935-2024), Bruder Karl Schmidt (1930-2010), Karl hatte 3 Kinder: Peter (1960), Sabine (1965), Michael (1962).',
          structuredData: JSON.stringify({
            familyTree: {
              root: 'Karl Schmidt',
              children: ['Peter Schmidt', 'Sabine Schmidt', 'Michael Schmidt'],
            },
          }),
          relevanceScore: '98.00',
          trustScore: '92.00',
          apiCost: '4.00',
          caseId: case2Id,
        },
      ]);
      console.log('  Created 5 research artifacts');

      // ========================================================================
      // 9. CREATE SAMPLE STRATEGIES
      // ========================================================================
      console.log('\nCreating sample strategies...');

      const strategy1Id = generateId();

      await db.insert(schema.strategies).values([
        {
          id: strategy1Id,
          name: 'Geschwister-Recherche Ancestry',
          description: 'Suche nach Geschwistern des Erblassers über Ancestry.de Familienstammbäume.',
          promptTemplate: 'Suche nach Geschwistern von {deceasedName}, geboren {birthDate} in {birthPlace}. Fokus auf Familienstammbäume und Geburtsurkunden.',
          targetIntegration: 'ancestry',
          parameters: JSON.stringify({
            maxResults: 20,
            includeDeceased: true,
            dateRange: '1900-2024',
          }),
          status: 'SUCCESSFUL',
          timesExecuted: 15,
          timesSuccessful: 12,
          successRate: '80.00',
          avgArtifactsFound: '4.50',
          avgCost: '3.20',
          isAiGenerated: false,
        },
        {
          id: generateId(),
          name: 'Melderegister-Abfrage',
          description: 'Anfrage beim zuständigen Einwohnermeldeamt nach aktueller Adresse.',
          promptTemplate: 'EMA-Anfrage für {personName}, letzte bekannte Adresse: {lastAddress}',
          targetIntegration: 'meldeamt',
          status: 'ACTIVE',
          timesExecuted: 8,
          timesSuccessful: 7,
          successRate: '87.50',
          avgArtifactsFound: '1.00',
          avgCost: '12.00',
          isAiGenerated: false,
        },
      ]);
      console.log('  Created 2 strategies');

      // ========================================================================
      // 10. CREATE SAMPLE DOCUMENTS
      // ========================================================================
      console.log('\nCreating sample documents...');

      await db.insert(schema.documents).values([
        {
          id: generateId(),
          type: 'COURT_INQUIRY',
          direction: 'outgoing',
          subject: 'Anfrage Nachlassakten Heinrich Müller',
          content: 'Sehr geehrte Damen und Herren,\n\nwir bitten um Übersendung der Nachlassakten zum Az. 123/2024.\n\nMit freundlichen Grüßen',
          recipient: 'Amtsgericht München - Nachlassgericht',
          caseId: case1Id,
          sentAt: new Date('2024-01-12'),
        },
        {
          id: generateId(),
          type: 'HEIR_CONTACT',
          direction: 'outgoing',
          subject: 'Mögliche Erbschaft - Margarete Schmidt',
          content: 'Sehr geehrter Herr Schmidt,\n\nwir sind mit der Erbenermittlung im Nachlass Ihrer Tante Margarete Schmidt beauftragt...',
          recipient: 'Peter Schmidt',
          caseId: case2Id,
          sentAt: new Date('2024-02-20'),
        },
        {
          id: generateId(),
          type: 'INTERNAL_NOTE',
          direction: 'internal',
          subject: 'Recherche-Status Update',
          content: 'Zwei von drei potentiellen Erben haben auf unsere Kontaktaufnahme reagiert. Dritter Erbe noch nicht erreicht.',
          caseId: case2Id,
        },
      ]);
      console.log('  Created 3 documents');

      // ========================================================================
      // 11. CREATE SAMPLE COMMENTS
      // ========================================================================
      console.log('\nCreating sample comments...');

      await db.insert(schema.comments).values([
        {
          id: generateId(),
          content: 'Erste Recherchewelle abgeschlossen. Zwei Geschwister des Erblassers identifiziert.',
          caseId: case1Id,
          authorId: detectiveUser.id,
        },
        {
          id: generateId(),
          content: 'Bruder Hans Müller möglicherweise noch lebend - Melderegister-Anfrage gestellt.',
          caseId: case1Id,
          authorId: detectiveUser.id,
        },
        {
          id: generateId(),
          content: 'Alle drei Neffen/Nichten erfolgreich kontaktiert. Erbscheinantrag kann vorbereitet werden.',
          caseId: case2Id,
          authorId: detectiveUser.id,
        },
      ]);
      console.log('  Created 3 comments');

    } else {
      console.log(`  Cases already exist (${existingCases.length}), skipping case creation`);
    }

    console.log('\n========================================');
    console.log('Database seed completed successfully!');
    console.log('========================================\n');
    console.log('Demo Accounts:');
    console.log('  Admin:     admin@pon2.de / password123');
    console.log('  Detective: detective@pon2.de / password123');
    console.log('  Detective: detective2@pon2.de / password123');
    console.log('\n');

  } catch (error) {
    console.error('\nSeed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
