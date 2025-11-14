import { PrismaClient, UserRole, CaseStatus, PersonRole, ArtifactType, StrategyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('Cleaning existing data...');
    await prisma.comment.deleteMany();
    await prisma.budgetTracking.deleteMany();
    await prisma.document.deleteMany();
    await prisma.strategyExecution.deleteMany();
    await prisma.researchArtifact.deleteMany();
    await prisma.researchWave.deleteMany();
    await prisma.strategy.deleteMany();
    await prisma.relationship.deleteMany();
    await prisma.contactInfo.deleteMany();
    await prisma.personCase.deleteMany();
    await prisma.person.deleteMany();
    await prisma.case.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@pon2.de',
      password: hashedPassword,
      firstName: 'Max',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
    },
  });

  const detective1 = await prisma.user.create({
    data: {
      email: 'detective@pon2.de',
      password: hashedPassword,
      firstName: 'Anna',
      lastName: 'Detektiv',
      role: UserRole.DETECTIVE,
    },
  });

  console.log('✓ Users created');

  // Create integrations
  console.log('Creating integrations...');

  const genealogyIntegration = await prisma.integration.create({
    data: {
      name: 'genealogy.net',
      type: 'genealogy',
      isActive: true,
      config: {
        apiKey: 'demo-key',
        endpoint: 'https://api.genealogy.net',
      },
      dailyCallLimit: 100,
      monthlyCostLimit: 50,
    },
  });

  const myheritageIntegration = await prisma.integration.create({
    data: {
      name: 'MyHeritage',
      type: 'genealogy',
      isActive: true,
      config: {
        apiKey: 'demo-key',
        endpoint: 'https://api.myheritage.com',
      },
      dailyCallLimit: 50,
      monthlyCostLimit: 100,
    },
  });

  const perplexityIntegration = await prisma.integration.create({
    data: {
      name: 'Perplexity',
      type: 'ai_research',
      isActive: true,
      config: {
        apiKey: process.env.PERPLEXITY_API_KEY || 'demo-key',
        endpoint: 'https://api.perplexity.ai',
      },
      dailyCallLimit: 30,
      monthlyCostLimit: 200,
    },
  });

  console.log('✓ Integrations created');

  // Create strategies
  console.log('Creating strategies...');

  const basicGenealogyStrategy = await prisma.strategy.create({
    data: {
      name: 'Grundrecherche genealogische Portale',
      description: 'Durchsucht genealogische Datenbanken nach Basisdaten zum Erblasser und direkten Verwandten',
      promptTemplate: 'Suche in genealogischen Datenbanken nach: {{lastName}} {{firstName}}, geboren {{birthDate}} in {{birthPlace}}',
      targetIntegration: 'genealogy.net',
      status: StrategyStatus.ACTIVE,
      parameters: {
        searchDepth: 2,
        includeVariants: true,
      },
      timesExecuted: 15,
      timesSuccessful: 12,
      successRate: 80,
      avgArtifactsFound: 8.5,
      avgCost: 2.5,
      isAiGenerated: false,
    },
  });

  const socialMediaStrategy = await prisma.strategy.create({
    data: {
      name: 'Social-Media-Suche nach Nachnamen + Ort',
      description: 'Nutzt Perplexity für tiefe Web- und Social-Media-Recherche basierend auf Namen und Orten',
      promptTemplate: 'Finde Social-Media-Profile und Online-Präsenz für Personen mit dem Namen {{lastName}} in {{location}}',
      targetIntegration: 'Perplexity',
      status: StrategyStatus.ACTIVE,
      parameters: {
        platforms: ['LinkedIn', 'Facebook', 'XING'],
        maxResults: 20,
      },
      timesExecuted: 8,
      timesSuccessful: 5,
      successRate: 62.5,
      avgArtifactsFound: 4.2,
      avgCost: 5.0,
      isAiGenerated: true,
    },
  });

  console.log('✓ Strategies created');

  // Create sample cases
  console.log('Creating sample cases...');

  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'ER-2024-00123',
      deceasedFirstName: 'Wilhelm',
      deceasedLastName: 'Müller',
      deceasedBirthDate: new Date('1945-03-15'),
      deceasedDeathDate: new Date('2023-11-20'),
      birthPlace: 'München',
      deathPlace: 'Hamburg',
      status: CaseStatus.IN_RESEARCH,
      court: 'AG Hamburg',
      estateValue: 250000,
      threshold: 5000,
      sourceType: 'Bundesanzeiger',
      sourceReference: 'BAnz AT 12.12.2023 B1',
      originalText: 'Das Amtsgericht Hamburg sucht die Erben des am 20.11.2023 verstorbenen Wilhelm Müller, geboren am 15.03.1945 in München...',
      budgetEur: 150,
      maxApiCallsPerSource: 50,
      notes: 'Keine bekannten Verwandten ersten Grades. Fokus auf Cousins/Cousinen.',
      createdById: detective1.id,
      assignedToId: detective1.id,
      successProbability: 65,
      researchWaveCount: 2,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'ER-2024-00124',
      deceasedFirstName: 'Elisabeth',
      deceasedLastName: 'Schmidt',
      deceasedBirthDate: new Date('1938-07-22'),
      deceasedDeathDate: new Date('2024-01-05'),
      birthPlace: 'Berlin',
      deathPlace: 'Berlin',
      status: CaseStatus.HEIRS_IDENTIFIED,
      court: 'AG Berlin-Charlottenburg',
      estateValue: 180000,
      sourceType: 'Bundesanzeiger',
      sourceReference: 'BAnz AT 15.01.2024 B3',
      budgetEur: 100,
      createdById: detective1.id,
      successProbability: 85,
      researchWaveCount: 1,
    },
  });

  const case3 = await prisma.case.create({
    data: {
      caseNumber: 'ER-2024-00125',
      deceasedFirstName: 'Hans',
      deceasedLastName: 'Weber',
      deceasedBirthDate: new Date('1952-11-30'),
      deceasedDeathDate: new Date('2023-12-10'),
      birthPlace: 'Frankfurt am Main',
      deathPlace: 'Frankfurt am Main',
      status: CaseStatus.NEW,
      court: 'AG Frankfurt',
      budgetEur: 100,
      createdById: detective1.id,
      researchWaveCount: 0,
    },
  });

  console.log('✓ Cases created');

  // Create persons for case 1
  console.log('Creating persons and relationships...');

  const deceased1 = await prisma.person.create({
    data: {
      firstName: 'Wilhelm',
      lastName: 'Müller',
      birthDate: new Date('1945-03-15'),
      deathDate: new Date('2023-11-20'),
      birthPlace: 'München',
      deathPlace: 'Hamburg',
      gender: 'M',
    },
  });

  await prisma.personCase.create({
    data: {
      personId: deceased1.id,
      caseId: case1.id,
      role: PersonRole.DECEASED,
    },
  });

  const heir1 = await prisma.person.create({
    data: {
      firstName: 'Thomas',
      lastName: 'Müller',
      birthDate: new Date('1972-05-10'),
      birthPlace: 'München',
      gender: 'M',
    },
  });

  await prisma.personCase.create({
    data: {
      personId: heir1.id,
      caseId: case1.id,
      role: PersonRole.POTENTIAL_HEIR,
      heirProbability: 75,
      reasoning: 'Cousin ersten Grades mütterlicherseits. Nachgewiesen durch Kirchenbucheintrag und genealogy.net-Recherche.',
    },
  });

  // Contact info for heir1
  await prisma.contactInfo.create({
    data: {
      personId: heir1.id,
      type: 'EMAIL',
      value: 'thomas.mueller@example.de',
      isVerified: false,
      trustScore: 60,
    },
  });

  await prisma.contactInfo.create({
    data: {
      personId: heir1.id,
      type: 'ADDRESS',
      value: 'Maximilianstraße 12, 80539 München',
      isVerified: false,
      trustScore: 70,
    },
  });

  // Create relationship
  await prisma.relationship.create({
    data: {
      type: 'COUSIN',
      fromPersonId: deceased1.id,
      toPersonId: heir1.id,
      trustScore: 85,
    },
  });

  console.log('✓ Persons and relationships created');

  // Create research waves and artifacts
  console.log('Creating research waves and artifacts...');

  const wave1 = await prisma.researchWave.create({
    data: {
      caseId: case1.id,
      waveNumber: 1,
      status: 'COMPLETED',
      maxBudgetEur: 50,
      actualCostEur: 35.50,
      artifactsFound: 3,
      personsFound: 2,
      startedAt: new Date('2024-01-10T10:00:00Z'),
      completedAt: new Date('2024-01-10T14:30:00Z'),
    },
  });

  const artifact1 = await prisma.researchArtifact.create({
    data: {
      type: ArtifactType.GENEALOGY_SEARCH,
      source: 'genealogy.net',
      sourceUrl: 'https://genealogy.net/search/12345',
      rawText: 'Familienstammbuch Müller, München: Wilhelm Müller, *15.03.1945 München, Eltern: Friedrich Müller und Maria geb. Wagner...',
      structuredData: {
        persons: [
          { name: 'Wilhelm Müller', birth: '1945-03-15', birthPlace: 'München' },
          { name: 'Friedrich Müller', relation: 'Vater' },
          { name: 'Maria Wagner', relation: 'Mutter' },
        ],
      },
      relevanceScore: 95,
      trustScore: 90,
      apiCost: 2.50,
      caseId: case1.id,
      researchWaveId: wave1.id,
    },
  });

  const artifact2 = await prisma.researchArtifact.create({
    data: {
      type: ArtifactType.PERPLEXITY_RESEARCH,
      source: 'Perplexity',
      rawText: 'Deep Web Research: Thomas Müller, München - LinkedIn-Profil gefunden, arbeitet als Ingenieur bei BMW. Email-Adresse aus öffentlichem Vereinsregister: thomas.mueller@example.de',
      structuredData: {
        person: 'Thomas Müller',
        location: 'München',
        occupation: 'Ingenieur bei BMW',
        contacts: ['thomas.mueller@example.de'],
      },
      relevanceScore: 80,
      trustScore: 75,
      apiCost: 8.00,
      caseId: case1.id,
      researchWaveId: wave1.id,
    },
  });

  console.log('✓ Research waves and artifacts created');

  // Create a document
  await prisma.document.create({
    data: {
      type: 'COURT_INQUIRY',
      direction: 'outgoing',
      subject: 'Auskunftsersuchen Nachlass Wilhelm Müller',
      content: 'Sehr geehrte Damen und Herren,\n\nwir ersuchen höflich um Auskunft zum Nachlass des am 20.11.2023 verstorbenen Wilhelm Müller...',
      recipient: 'AG Hamburg, Nachlassabteilung',
      sender: 'Erbenermittlung Schmidt & Partner',
      caseId: case1.id,
    },
  });

  console.log('✓ Documents created');

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 2 users (admin@pon2.de / detective@pon2.de)');
  console.log('   - Password for all users: password123');
  console.log('   - 3 integrations (genealogy.net, MyHeritage, Perplexity)');
  console.log('   - 2 strategies');
  console.log('   - 3 sample cases with research data');
  console.log('   - Multiple persons, relationships, artifacts, and documents');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
