import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

async function callGemini(key: string, body: object, timeoutMs = 120000): Promise<any> {
  let delay = 8000;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        body,
        { timeout: timeoutMs }
      );
    } catch (err: any) {
      if (attempt < 3 && err?.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

// Subject-specific configs
interface SubjectConfig {
  questionCount: number;
  timeLimitSec: number;
  nameEn: string;
  nameAf: string;
  grades: number[];
  buildPrompt: (grade: number) => string;
}

function langPrompt(subjectLang: string, grade: number): string {
  const age = grade + 5;
  const isFoundation = grade <= 3;
  const qCount = isFoundation ? 20 : 30;

  // For language tests: questions AND options must be in the subject's language
  // The other field provides translation for parents/bilingual display
  const langConfig: Record<string, { name: string; primaryField: string; secondaryField: string; secondaryLang: string }> = {
    english: { name: 'English', primaryField: 'question_en', secondaryField: 'question_af', secondaryLang: 'Afrikaans' },
    afrikaans: { name: 'Afrikaans', primaryField: 'question_af', secondaryField: 'question_en', secondaryLang: 'English' },
    setswana: { name: 'Setswana', primaryField: 'question_en', secondaryField: 'question_af', secondaryLang: 'English' },
    french: { name: 'French', primaryField: 'question_fr', secondaryField: 'question_en', secondaryLang: 'English' },
    zulu: { name: 'IsiZulu', primaryField: 'question_zu', secondaryField: 'question_en', secondaryLang: 'English' },
    xhosa: { name: 'IsiXhosa', primaryField: 'question_xh', secondaryField: 'question_en', secondaryLang: 'English' },
    sepedi: { name: 'Sepedi', primaryField: 'question_nso', secondaryField: 'question_en', secondaryLang: 'English' },
    sesotho: { name: 'Sesotho', primaryField: 'question_st', secondaryField: 'question_en', secondaryLang: 'English' },
    venda: { name: 'Tshivenḓa', primaryField: 'question_ve', secondaryField: 'question_en', secondaryLang: 'English' },
    swati: { name: 'Siswati', primaryField: 'question_ss', secondaryField: 'question_en', secondaryLang: 'English' },
    tsonga: { name: 'Xitsonga', primaryField: 'question_ts', secondaryField: 'question_en', secondaryLang: 'English' },
    ndebele: { name: 'isiNdebele', primaryField: 'question_nr', secondaryField: 'question_en', secondaryLang: 'English' },
    spanish: { name: 'Spanish', primaryField: 'question_es', secondaryField: 'question_en', secondaryLang: 'English' },
    portuguese: { name: 'Portuguese', primaryField: 'question_pt', secondaryField: 'question_en', secondaryLang: 'English' },
  };
  const cfg = langConfig[subjectLang] || langConfig.english;

  const categoryBlock = isFoundation ? `
  * Spelling — "Which word is spelled correctly?" (common Grade ${grade} words)
  * Vocabulary — "What does this word mean?" or "Which word matches the picture description?"
  * Phonics — "Which word rhymes with ___?" or "Which word starts with the same sound?"
  * Sentence completion — "Fill in the missing word"
` : `
  * Spelling — "Which word is spelled correctly?" (Grade ${grade} level words)
  * Vocabulary — word meanings, synonyms, antonyms
  * Grammar — Tenses, plurals, pronouns, sentence structure
  * Comprehension — Short sentence, answer a question about it
  * Idioms/Expressions — Common expressions and their meaning
`;

  return `You are a South African ${cfg.name} language teacher creating a practice test for Grade ${grade} learners (age ${age}).

Generate exactly ${qCount} multiple choice questions testing ${cfg.name} language skills.

CRITICAL RULES:
- ALL questions must be written IN ${cfg.name}
- ALL answer options (A), (B), (C), (D) must be IN ${cfg.name}
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be appropriate for Grade ${grade} ${cfg.name} CAPS curriculum

For the JSON output:
- "${cfg.primaryField}" = the question in ${cfg.name} (this is the MAIN question)
- "${cfg.secondaryField}" = translation in ${cfg.secondaryLang} (for parents who don't speak ${cfg.name})

Cover these categories evenly:
${categoryBlock}

Return ONLY a valid JSON array:
[
  {
    "${cfg.primaryField}": "Question in ${cfg.name} here...",
    "${cfg.secondaryField}": "Translation in ${cfg.secondaryLang} here...",
    "options": ["(A) option in ${cfg.name}", "(B) option in ${cfg.name}", "(C) option in ${cfg.name}", "(D) option in ${cfg.name}"],
    "correct": 0,
    "category": "spelling"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- EVERYTHING the learner sees (question + options) must be in ${cfg.name}
- The translation field is ONLY for parents, not shown to the child as the main question
- Use South African context and vocabulary
- Grade ${grade} appropriate difficulty
- Mix easy and harder questions
- Do NOT include any text outside the JSON array

CRITICAL — QUESTION QUALITY RULES:
- Every question MUST have exactly ONE correct answer. The other 3 options must be CLEARLY wrong.
- NEVER create fill-in-the-blank questions where more than one option could be correct (e.g. "The dog likes to ___ his bone" where both "hide" and "eat" work — this is BAD)
- For sentence completion questions: make the correct answer the ONLY one that makes grammatical and logical sense
- The translation MUST accurately match the primary question. Every noun, verb, and object must translate correctly. Do NOT use words that have double meanings (e.g. Afrikaans "been" means "leg" AND "bone" — pick the unambiguous word)
- If the primary question says "bone", the translation must use the word for "bone", not a word that also means "leg"
- Test each question: "Could a reasonable Grade ${grade} child argue that another option is also correct?" If yes, rewrite the question.`;
}

const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  english: {
    questionCount: 30,
    timeLimitSec: 1800,
    nameEn: 'English',
    nameAf: 'Engels',
    grades: [1,2,3,4,5,6,7,8,9],
    buildPrompt: (grade: number) => langPrompt('english', grade),
  },
  afrikaans: {
    questionCount: 30,
    timeLimitSec: 1800,
    nameEn: 'Afrikaans',
    nameAf: 'Afrikaans',
    grades: [1,2,3,4,5,6,7,8,9],
    buildPrompt: (grade: number) => langPrompt('afrikaans', grade),
  },
  setswana: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Setswana',
    nameAf: 'Setswana',
    grades: [1,2,3,4,5,6,7,8,9],
    buildPrompt: (grade: number) => langPrompt('setswana', grade),
  },
  french: {
    questionCount: 30,
    timeLimitSec: 1800,
    nameEn: 'French',
    nameAf: 'Frans',
    grades: [1,2,3,4,5,6,7,8,9,10,11,12],
    buildPrompt: (grade: number) => langPrompt('french', grade),
  },
  zulu: {
    questionCount: 30,
    timeLimitSec: 1800,
    nameEn: 'IsiZulu',
    nameAf: 'Zoeloe',
    grades: [1,2,3,4,5,6,7,8,9,10,11,12],
    buildPrompt: (grade: number) => langPrompt('zulu', grade),
  },
  natural_science: {
    questionCount: 40,
    timeLimitSec: 3600,
    nameEn: 'Natural Sciences',
    nameAf: 'Natuurwetenskap',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => {
      const isSenior = grade >= 7;
      const subjectName = isSenior ? 'Natural Sciences' : 'Natural Science and Technology';
      const topicsBlock = isSenior
        ? grade <= 7
          ? `  * Life and Living: cells (plant vs animal cell differences), photosynthesis, food webs, biodiversity, nutrient cycles, ecosystems
  * Matter and Materials: mixtures vs pure substances, solutions and suspensions, separation techniques (filtration, evaporation, distillation, chromatography)
  * Energy and Change: series and parallel circuits, energy conversions, heat transfer (conduction, convection, radiation)
  * Earth and Beyond: rock cycle, weathering and erosion, South African biomes and geology`
          : `  * Life and Living: cell organelles and functions, photosynthesis vs respiration (detailed), human nutrition and digestion, plant and animal reproduction
  * Matter and Materials: atoms, elements and compounds, periodic table (first 20 elements), physical vs chemical changes, basic chemical equations
  * Energy and Change: electrostatics, Ohm's law, electric circuits, magnetism and electromagnets
  * Earth and Beyond: solar system and universe, plate tectonics, earth's structure and processes`
        : `  * Life and Living (plants, animals, ecosystems, food chains, life cycles)
  * Energy and Change (heat, light, sound, electricity, energy transfer)
  * Matter and Materials (states of matter, mixtures, materials, properties)
  * Planet Earth and Beyond (weather, seasons, the solar system, rocks, soil, water cycle)`;

      return `You are a South African ${subjectName} teacher creating a practice test for Grade ${grade}.

Generate exactly 40 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS ${subjectName} curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Cover these topics proportionally:
${topicsBlock}

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "life_and_living"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context (springbok, protea, Table Mountain, SA biomes, Kruger Park, local weather)
- First 20 questions easier, last 20 harder
- Questions must test understanding and reasoning, not just recall
- Grade ${grade} appropriate vocabulary and concepts
- Do NOT include any text outside the JSON array`;
    },
  },

  life_skills: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Life Skills',
    nameAf: 'Lewensvaardighede',
    grades: [1,2,3],
    buildPrompt: (grade: number) => {
      const age = grade + 5;
      return `You are a South African Foundation Phase teacher creating a fun Beginning Knowledge quiz for Grade ${grade} children (age ${age}-${age + 1}).

Generate exactly 20 multiple choice questions. Each question must:
- Be appropriate for a Grade ${grade} child (age ${age}-${age + 1})
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Use SIMPLE language and SHORT sentences
- Cover these Beginning Knowledge topics (4 questions each):
  * Animals (farm animals, wild animals, pets, habitats, what animals eat)
  * Plants (parts of a plant, what plants need to grow, types of plants)
  * Weather and Seasons (rain, sun, wind, hot, cold, summer, winter, spring, autumn)
  * My Body and Health (body parts, healthy food, exercise, hygiene, senses)
  * Safety (road safety, stranger danger, fire safety, water safety, emergency numbers)

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "animals"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Keep language at Grade ${grade} reading level — simple words, short sentences
- Questions should be fun and relatable to a young South African child
- Use familiar SA context (mielies, braai, taxi, Kruger Park, Table Mountain)
- Grade 1: very simple recognition, Grade 2: slightly harder, Grade 3: beginning to reason
- Do NOT include any text outside the JSON array`;
    },
  },
  mathematics: {
    questionCount: 30,
    timeLimitSec: 2400,
    nameEn: 'Mathematics',
    nameAf: 'Wiskunde',
    grades: [7,8,9],
    buildPrompt: (grade: number) => {
      const topics: Record<number, string> = {
        7: `  * Numbers: integers, fractions, decimals, percentages, exponents, scientific notation
  * Algebra: algebraic expressions (simplify, expand), simple equations, substitution
  * Geometry: angles (supplementary, complementary, vertically opposite), triangles (types, properties), 2D shapes, perimeter, area, volume basics
  * Data Handling: collecting and organising data, bar graphs, pie charts, mean, median, mode, range, probability`,
        8: `  * Numbers: rational and irrational numbers, integer exponents, scientific notation, intro to surds
  * Algebra: algebraic expressions (factorisation, product of binomials), linear equations, linear inequalities, simultaneous equations (intro)
  * Geometry: theorem of Pythagoras, similar and congruent triangles, area and perimeter, volume of 3D shapes
  * Functions and Graphs: linear functions, plotting on Cartesian plane, gradient and y-intercept
  * Data Handling: measures of central tendency, spread, probability, tree diagrams`,
        9: `  * Numbers: surds, number patterns, rational and irrational numbers
  * Algebra: factorisation (trinomials, difference of squares), algebraic fractions, quadratic equations (intro), simultaneous equations
  * Functions and Graphs: linear and quadratic functions, gradient, intercepts, parabola basics
  * Financial Maths: simple and compound interest, hire purchase, exchange rates, inflation
  * Geometry: congruency, similarity, Pythagoras, surface area and volume of 3D objects
  * Data Handling: statistical summaries, probability`,
      };
      return `You are a South African Mathematics teacher creating a practice test for Grade ${grade}.

Generate exactly 30 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS Mathematics curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Include calculation questions with real numbers (not just conceptual)
- Cover these topics proportionally:
${topics[grade] || topics[9]}

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "algebra"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Mix calculation questions (show working in options) with conceptual questions
- First 15 questions easier, last 15 harder
- Grade ${grade} SA CAPS appropriate difficulty
- Do NOT include any text outside the JSON array`;
    },
  },

  life_orientation: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Life Orientation',
    nameAf: 'Lewensoriëntering',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => {
      const isSenior = grade >= 7;
      const topics = isSenior
        ? `  * Development of the Self: identity, self-concept, peer pressure, healthy relationships, decision-making, goal setting
  * Social and Environmental Responsibility: substance abuse (effects, prevention), community issues, environmental awareness, human rights
  * Democracy, Human Rights and Responsibilities: SA Constitution, Bill of Rights, gender equality, diversity, responsible citizenship
  * Career and Career Choices: career paths, further education options, skills and interests, world of work
  * Physical Education: fitness components, sport rules, health and wellness, safety in sport`
        : `  * Personal Development: self-concept, emotions, friendships, values, respect, self-esteem
  * Social Development: family roles, community, diversity, rights and responsibilities, Ubuntu
  * Physical Development: healthy lifestyle, nutrition basics, sport and play, safety, first aid basics
  * Citizenship: SA national symbols, Constitution basics, democracy, community service
  * Career Awareness: different careers, skills and strengths, interests, future planning`;
      return `You are a South African Life Orientation teacher creating a practice test for Grade ${grade}.

Generate exactly 20 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS Life Orientation curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Be scenario-based and practical where possible
- Cover these topics proportionally:
${topics}

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "personal_development"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context (Ubuntu, SA Constitution, local communities, SA sports, SAPS, SASSA)
- Questions should be scenario-based and practical, not just factual recall
- Grade ${grade} appropriate language and content
- Do NOT include any text outside the JSON array`;
    },
  },

  social_sciences: {
    questionCount: 25,
    timeLimitSec: 2400,
    nameEn: 'Social Sciences',
    nameAf: 'Sosiale Wetenskappe',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => buildSocialSciencesPrompt(grade, 'history'),
  },

  ems: {
    questionCount: 25,
    timeLimitSec: 2400,
    nameEn: 'Economic and Management Sciences',
    nameAf: 'Ekonomiese en Bestuurswetenskappe',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => {
      const isSenior = grade >= 7;
      const topics = isSenior
        ? `  * The Economy: economic systems, factors of production, entrepreneurship, circular flow of income
  * Financial Literacy: personal and business budgets, banking services (accounts, interest, loans), financial documents (invoice, receipt, statement, balance sheet basics)
  * The Business Environment: forms of business ownership (sole trader, partnership, company, cooperative), sectors, consumer rights
  * The Entrepreneur: characteristics of entrepreneurs, business plan basics, SWOT analysis, risk and reward`
        : `  * The Economy: goods and services, needs vs wants, economic sectors (primary, secondary, tertiary), basic economic concepts
  * Financial Literacy: income and expenses, budgets, savings, banking basics, financial records
  * The Entrepreneur: characteristics of entrepreneurs, business ideas, planning basics
  * Business Environment: role of business in society, local business environment, production process`;
      return `You are a South African Economic and Management Sciences (EMS) teacher creating a practice test for Grade ${grade}.

Generate exactly 25 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS EMS curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Cover these topics proportionally:
${topics}

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "financial_literacy"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context (rand, SA banks like FNB/Nedbank/Standard Bank, local businesses)
- Include practical calculation questions for financial literacy (profit/loss, budgets, interest)
- Mix scenario-based and knowledge questions
- Grade ${grade} appropriate difficulty
- Do NOT include any text outside the JSON array`;
    },
  },

  technology: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Technology',
    nameAf: 'Tegnologie',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => {
      const isSenior = grade >= 7;
      const topics = isSenior
        ? `  * Design Process: design brief, investigation, design drawings/sketches, make (materials and tools), evaluate, communicate (portfolio)
  * Structures: types of forces (tension, compression, torsion, shear), strength and stability, building structures
  * Mechanical Systems and Control: levers, gears, pulleys, cams, linkages — input-process-output
  * Electrical Systems: circuit components, series and parallel, circuit diagrams, control devices
  * Electronics and Control (Gr 8-9): resistors, capacitors, diodes, transistors, logic gates, PCB basics
  * Processing: food processing, material processing (metals, wood, textiles), industrial processes`
        : `  * Design Process: problem identification, design brief, design drawing, making a model, evaluating the solution
  * Structures: natural and man-made structures, strength (frames and shells), stability
  * Mechanical Systems: levers (1st, 2nd, 3rd class), gears (driver and driven), pulleys, wheels and axles
  * Electrical Systems: simple circuits, components (cells, bulbs, switches), series and parallel circuits
  * Processing: how materials are processed (food, paper, metal, plastic), recycling`;
      return `You are a South African Technology teacher creating a practice test for Grade ${grade}.

Generate exactly 20 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS Technology curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Cover these topics proportionally:
${topics}

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "design_process"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Include practical design and problem-solving scenarios
- Use South African context where possible (local materials, SA industries)
- Questions should test understanding AND practical application, not just definitions
- Grade ${grade} appropriate difficulty
- Do NOT include any text outside the JSON array`;
    },
  },
};

// Social Sciences strand prompt (History or Geography)
function buildSocialSciencesPrompt(grade: number, strand: string): string {
  const isSenior = grade >= 7;

  const strands: Record<string, { label: string; topics: string }> = {
    history: {
      label: 'History',
      topics: isSenior
        ? grade === 7
          ? `The Ancient World: African kingdoms (Mali, Great Zimbabwe, Mutapa), exploration and contact (European explorers), early SA history (Khoisan, Bantu-speaking peoples)`
          : grade === 8
            ? `Colonialism and Resistance: settler colonialism in SA, conquest wars, slavery at the Cape, resistance movements, SA in the 19th century`
            : `SA History: apartheid system (laws, institutions, effects), resistance movements (ANC, PAC, BCM, Defiance Campaign), international pressure, transition to democracy (1990–1994), SA Constitution`
        : grade <= 5
          ? `Ancient Civilisations: Egypt (pharaohs, pyramids, Nile), Ancient Greece (democracy, philosophy, Olympics), early African kingdoms; SA Early History: Khoisan people, Bantu-speaking communities, early trade`
          : `SA Colonialism (Gr 6): VOC, Dutch/British settlement at the Cape, impact on Khoisan, slavery, frontier conflicts; Indigenous SA societies before colonialism`,
    },
    geography: {
      label: 'Geography',
      topics: isSenior
        ? grade === 7
          ? `Map work (scale, direction, grid references, contour lines); Resources: energy resources (fossil fuels, renewable energy, SA energy crisis); Climate: weather vs climate, factors affecting climate, SA climate regions`
          : grade === 8
            ? `Map work (aerial photos, topographic maps, cross-sections); Development: economic development indicators (GDP, HDI, poverty), developed vs developing countries; Economic Geography: primary, secondary, tertiary sectors; SA economic regions`
            : `Map work (advanced: bearing, altitude, gradient); Global Issues: climate change (causes, effects, SA impact), food security, population growth; Development: sustainable development, trade, globalisation; SA resources and economy`
        : grade <= 5
          ? `SA Geography: provinces, major cities, rivers, biomes; Maps: compass directions, symbols, basic maps; Climate and Weather: seasons, rainfall patterns, SA weather; Natural Resources: water, soil, energy in SA`
          : `SA and World Geography (Gr 6): Africa (countries, physical features, biomes), climate zones, population distribution; Trade and Resources: SA exports, farming regions, economic activities`,
    },
  };

  const s = strands[strand] || strands.history;

  return `You are a South African Social Sciences teacher creating a ${s.label} practice test for Grade ${grade}.

Generate exactly 25 multiple choice questions testing ONLY ${s.label} content.

Cover these topics:
  ${s.topics}

Each question must:
- Be appropriate for Grade ${grade} SA CAPS Social Sciences (${s.label}) curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "${strand}"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context and examples (SA history, SA geography, SA people and places)
- Mix factual questions with source analysis and map/diagram interpretation questions
- Questions must test understanding and application, not just recall
- Grade ${grade} appropriate vocabulary and difficulty
- Do NOT include any text outside the JSON array`;
}

// Strand-specific natural science prompt (overrides full 4-strand test)
function buildNaturalScienceStrandPrompt(grade: number, strand: string): string {
  const isSenior = grade >= 7;
  const subjectName = isSenior ? 'Natural Sciences' : 'Natural Science and Technology';

  const strands: Record<string, { label: string; topics: string }> = {
    life_and_living: {
      label: 'Life and Living',
      topics: isSenior
        ? grade === 7
          ? `cells (plant vs animal cell differences), photosynthesis, food webs, biodiversity, nutrient cycles, ecosystems, life cycles`
          : `cell organelles and functions, photosynthesis vs respiration, human nutrition and digestion, plant and animal reproduction`
        : `plants (parts, growth, photosynthesis), animals (habitats, food chains, life cycles), ecosystems and food webs`,
    },
    matter_and_materials: {
      label: 'Matter and Materials',
      topics: isSenior
        ? grade === 7
          ? `mixtures vs pure substances, solutions and suspensions, separation techniques (filtration, evaporation, distillation, chromatography)`
          : `atoms, elements and compounds, periodic table (first 20 elements), physical vs chemical changes, basic chemical equations`
        : `states of matter, properties of materials, mixtures and separation, recycling and materials`,
    },
    energy_and_change: {
      label: 'Energy and Change',
      topics: isSenior
        ? grade === 7
          ? `series and parallel circuits, energy conversions, heat transfer (conduction, convection, radiation), light and sound`
          : `electrostatics, Ohm's law, electric circuits, magnetism, electromagnets, energy transformations`
        : `heat and temperature, light (reflection, refraction), sound (pitch, volume), simple electricity and circuits`,
    },
    earth_and_beyond: {
      label: 'Earth and Beyond',
      topics: isSenior
        ? grade === 7
          ? `rock cycle, weathering and erosion, South African biomes, soil formation, water cycle`
          : `solar system and universe, plate tectonics, earth's structure (crust, mantle, core), rock types`
        : `weather and seasons, solar system and planets, rocks and soil, the water cycle`,
    },
  };

  const s = strands[strand];
  if (!s) return '';

  return `You are a South African ${subjectName} teacher creating a focused strand test for Grade ${grade}.

Generate exactly 20 multiple choice questions testing ONLY the "${s.label}" strand.

Cover these topics:
  ${s.topics}

Each question must:
- Be appropriate for Grade ${grade} SA CAPS ${subjectName} curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "${s.label.toLowerCase().replace(/ /g, '_')}"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context (Kruger Park, Table Mountain, Karoo, SA biomes, Vaal River)
- Questions must test understanding, not just recall
- Grade ${grade} appropriate vocabulary and difficulty
- Do NOT include any text outside the JSON array`;
}

// POST /api/subject-tests/generate — Generate AI test for any subject
router.post('/generate', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { subject_code, grade, language, strand } = req.body;

  if (!subject_code || !grade) {
    throw new AppError('subject_code and grade are required', 400);
  }

  const config = SUBJECT_CONFIGS[subject_code];
  if (!config) {
    throw new AppError(`Unknown subject: ${subject_code}`, 400);
  }

  const gradeNum = parseInt(grade);
  if (!config.grades.includes(gradeNum)) {
    throw new AppError(`Grade ${grade} is not available for ${subject_code}`, 400);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new AppError('GEMINI_API_KEY not configured', 500);
  }

  let strandPrompt = '';
  if (strand && subject_code === 'natural_science') {
    strandPrompt = buildNaturalScienceStrandPrompt(gradeNum, strand);
  } else if (strand && subject_code === 'social_sciences') {
    strandPrompt = buildSocialSciencesPrompt(gradeNum, strand);
  }
  const prompt = strandPrompt || config.buildPrompt(gradeNum);

  try {
    const geminiResponse = await callGemini(geminiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    });

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) {
      throw new AppError('AI returned empty response', 500);
    }

    // Parse JSON (strip markdown code blocks if present)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    let questions: any[];
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      throw new AppError('Failed to parse AI response', 500);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('No questions generated', 500);
    }

    // Verify answers using a second AI call (catches wrong correct indices)
    try {
      const verifyPrompt = `You are a strict teacher verifying test answers for Grade ${grade} learners. Check EVERY question for these problems:

1. WRONG ANSWER: Is the marked correct answer actually correct? If not, provide the right index.
2. AMBIGUITY: Could more than one option be a valid answer? If yes, flag it for removal.
3. TRANSLATION MISMATCH: Does the translation accurately match the primary question? Check every noun, verb, and object. Words with double meanings (like Afrikaans "been" meaning both "leg" and "bone") must be flagged.

Return ONLY a JSON array:
[
  {"index": 0, "verified_correct": 2, "reason": "wrong answer"},
  {"index": 3, "remove": true, "reason": "ambiguous - both eat and hide are valid"},
  {"index": 5, "fix_translation": "corrected translation", "reason": "been means leg not bone"}
]

Only include questions with problems. If all are perfect, return [].

Questions:
${JSON.stringify(questions.map((q: any, i: number) => ({
  index: i,
  question_en: q.question_en || '',
  question_af: q.question_af || '',
  options: q.options,
  marked_correct: q.correct,
})))}

Be STRICT. A child who reads both languages should never get a different answer from each version. Return ONLY the JSON array.`;

      const verifyResponse = await callGemini(geminiKey, {
        contents: [{ parts: [{ text: verifyPrompt }] }],
        generationConfig: { temperature: 0 },
      }, 60000);
      const verifyText = verifyResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let vJson = verifyText.trim();
      if (vJson.startsWith('```')) vJson = vJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const vMatch = vJson.match(/\[[\s\S]*\]/);
      if (vMatch) {
        const fixes = JSON.parse(vMatch[0]);
        const removeIndices = new Set<number>();
        for (const fix of fixes) {
          if (fix.index < 0 || fix.index >= questions.length) continue;
          // Remove ambiguous questions entirely
          if (fix.remove) {
            removeIndices.add(fix.index);
            continue;
          }
          // Fix wrong correct answer
          if (fix.verified_correct !== undefined) {
            questions[fix.index].correct = fix.verified_correct;
          }
          // Fix bad translation
          if (fix.fix_translation) {
            const q = questions[fix.index];
            // Update whichever field is the translation (secondary)
            if (q.question_af && fix.fix_translation) q.question_af = fix.fix_translation;
            else if (q.question_en && fix.fix_translation) q.question_en = fix.fix_translation;
          }
        }
        // Remove flagged ambiguous questions
        if (removeIndices.size > 0) {
          const filtered = questions.filter((_: any, i: number) => !removeIndices.has(i));
          questions.length = 0;
          questions.push(...filtered);
        }
      }
    } catch { /* verification failed — use original answers */ }

    // Shuffle options for each question so correct answer isn't always B/C
    for (const q of questions) {
      if (!q.options || q.correct === undefined) continue;
      const correctOption = q.options[q.correct];
      // Fisher-Yates shuffle
      for (let i = q.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
      }
      // Update correct index to new position
      q.correct = q.options.indexOf(correctOption);
      // Re-label options with (A), (B), (C), (D)
      const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];
      q.options = q.options.map((opt: string, i: number) => {
        // Strip existing label like "(A) " and add new one
        const text = opt.replace(/^\([A-E]\)\s*/, '');
        return `${labels[i]} ${text}`;
      });
    }

    const lang = language || 'en';
    const strandLabels: Record<string, string> = {
      life_and_living: 'Life & Living', matter_and_materials: 'Matter & Materials',
      energy_and_change: 'Energy & Change', earth_and_beyond: 'Earth & Beyond',
      history: 'History', geography: 'Geography',
    };
    const strandSuffix = strand && strandLabels[strand] ? ` — ${strandLabels[strand]}` : '';
    const templateName = lang === 'af'
      ? `${config.nameAf} Gr ${grade}${strandSuffix}`
      : `${config.nameEn} Gr ${grade}${strandSuffix}`;

    const template = await prisma.math_test_templates.create({
      data: {
        name: templateName,
        grade: gradeNum,
        subject_code,
        operations: ['multiple_choice'],
        time_limit_sec: config.timeLimitSec,
        questions_json: questions as any,
        question_count: questions.length,
        language: lang,
        created_by: req.userId || null,
      },
    });

    res.json({
      id: template.id,
      name: template.name,
      grade: template.grade,
      subject_code,
      time_limit_sec: template.time_limit_sec,
      question_count: template.question_count,
      language: template.language,
      type: 'multiple_choice',
      questions: questions.map((q: any) => ({
        question_af: q.question_af,
        question_en: q.question_en,
        options: q.options,
        category: q.category,
      })),
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Subject test generation error:', err.message);
    throw new AppError('Failed to generate test. Please try again.', 500);
  }
});

// POST /api/subject-tests/lesson — Generate a vocabulary lesson for language learning
router.post('/lesson', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { language, level } = req.body;

  if (!language) throw new AppError('language is required', 400);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  const langNames: Record<string, string> = {
    setswana: 'Setswana',
    afrikaans: 'Afrikaans',
    english: 'English',
    french: 'French',
    zulu: 'IsiZulu',
    xhosa: 'IsiXhosa',
    sepedi: 'Sepedi',
    sesotho: 'Sesotho',
    venda: 'Tshivenḓa',
    swati: 'Siswati',
    tsonga: 'Xitsonga',
    ndebele: 'isiNdebele',
    spanish: 'Spanish',
    portuguese: 'Portuguese',
    swahili: 'Swahili (Kiswahili)',
  };
  const targetLang = langNames[language] || language;
  const lvl = level || 'beginner';

  const prompt = `You are a friendly ${targetLang} language teacher for an adult South African learner at ${lvl} level.

Generate a vocabulary lesson with exactly 10 words/phrases. For each entry provide:
- The word/phrase in ${targetLang}
- English translation
- Afrikaans translation
- A detailed pronunciation guide written phonetically for English/Afrikaans speakers. Break each syllable with hyphens and use CAPITALS for the stressed syllable. Use familiar sounds (e.g. "doo-MEH-lah" not IPA symbols).
- A short example sentence in ${targetLang}
- English translation of the example sentence
- Afrikaans translation of the example sentence
- A category (greetings, numbers, food, animals, family, directions, shopping, weather, colors, body)

Return ONLY a valid JSON array:
[
  {
    "word": "Dumela",
    "translation_en": "Hello",
    "translation_af": "Hallo",
    "pronunciation": "doo-MEH-lah",
    "example": "Dumela, o kae?",
    "example_en": "Hello, how are you?",
    "example_af": "Hallo, hoe gaan dit?",
    "category": "greetings"
  }
]

IMPORTANT:
- Mix categories so the lesson is varied
- Start with common, everyday words
- For ${lvl} level: ${lvl === 'beginner' ? 'very basic greetings, numbers 1-10, simple nouns' : lvl === 'intermediate' ? 'conversational phrases, verbs, descriptive words' : 'complex sentences, idioms, formal language'}
- ACCURACY IS CRITICAL: Every ${targetLang} word must be the REAL, CORRECT word. Do NOT guess or fabricate translations.
- For numbers: 1=nngwe, 2=pedi, 3=tharo, 4=nne, 5=tlhano, 6=thataro, 7=supa, 8=robedi, 9=robongwe, 10=lesome (in Setswana)
- Use correct ${targetLang} spelling and grammar — double-check before including
- The pronunciation guide must be VERY detailed and accurate
- Make it fun and practical for daily use in South Africa
- Do NOT include any text outside the JSON array`;

  try {
    const geminiResponse = await callGemini(geminiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 },
    }, 60000);

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) throw new AppError('AI returned empty response', 500);

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    const words = JSON.parse(jsonStr);
    if (!Array.isArray(words) || words.length === 0) {
      throw new AppError('No words generated', 500);
    }

    // Verify every word/translation using a second AI call
    try {
      const verifyPrompt = `You are a ${targetLang} language expert. Verify each word and translation below. For each entry, check:
1. Is the ${targetLang} word correct and properly spelled?
2. Does the English translation match?
3. Does the Afrikaans translation match?
4. Is the example sentence grammatically correct in ${targetLang}?

If ANY entry is wrong, provide the corrected version. Return ONLY a JSON array of corrections:
[{"index": 0, "word": "corrected word", "translation_en": "corrected", "translation_af": "corrected", "pronunciation": "corrected"}]

Only include entries that need fixing. If all correct, return [].

Words to verify:
${JSON.stringify(words.map((w: any, i: number) => ({ index: i, word: w.word, translation_en: w.translation_en, translation_af: w.translation_af, pronunciation: w.pronunciation })))}

IMPORTANT: Be strict. ${targetLang} vocabulary must be 100% accurate. Return ONLY the JSON array.`;

      const verifyResponse = await callGemini(geminiKey, {
        contents: [{ parts: [{ text: verifyPrompt }] }],
        generationConfig: { temperature: 0 },
      }, 60000);
      const vText = verifyResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let vJson = vText.trim();
      if (vJson.startsWith('```')) vJson = vJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const vMatch = vJson.match(/\[[\s\S]*\]/);
      if (vMatch) {
        const fixes = JSON.parse(vMatch[0]);
        for (const fix of fixes) {
          if (fix.index >= 0 && fix.index < words.length) {
            if (fix.word) words[fix.index].word = fix.word;
            if (fix.translation_en) words[fix.index].translation_en = fix.translation_en;
            if (fix.translation_af) words[fix.index].translation_af = fix.translation_af;
            if (fix.pronunciation) words[fix.index].pronunciation = fix.pronunciation;
          }
        }
      }
    } catch { /* verification failed — use original */ }

    res.json({ words, language, level: lvl });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Lesson generation error:', err.message);
    throw new AppError('Failed to generate lesson. Please try again.', 500);
  }
});

// POST /api/subject-tests/mock — Custom scope mock assessment (student-defined topics)
router.post('/mock', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { subject_name, grade, scope, language } = req.body;

  if (!subject_name || !grade || !Array.isArray(scope) || scope.length === 0) {
    throw new AppError('subject_name, grade and scope (array of topics) are required', 400);
  }
  const gradeNum = parseInt(grade);
  if (gradeNum < 1 || gradeNum > 12) throw new AppError('Grade must be 1–12', 400);
  if (scope.length > 10) throw new AppError('Maximum 10 topics per mock assessment', 400);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  const lang = language || 'en';
  const qCount = Math.min(Math.max(scope.length * 4, 12), 30);
  const timeLimitSec = qCount * 90;
  const scopeList = (scope as string[]).map((t, i) => `${i + 1}. ${t}`).join('\n');

  const prompt = `You are a South African ${subject_name} teacher creating a personalised mock exam for Grade ${gradeNum} learners.

The learner's study scope for this exam:
${scopeList}

Generate exactly ${qCount} multiple choice questions. Distribute questions as evenly as possible across ALL topics — every topic must appear in at least 2 questions.

Each question must:
- Be appropriate for Grade ${gradeNum} South African CAPS curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans
- Have a "scope_topic" field that is an EXACT copy of one topic name from the scope list above

Return ONLY a valid JSON array:
[
  {
    "question_en": "...",
    "question_af": "...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "scope_topic": "exact topic name from scope list",
    "category": "exact topic name from scope list"
  }
]

IMPORTANT:
- scope_topic must be EXACTLY one of the topic strings provided — copy it verbatim, no paraphrasing
- Every topic must appear in at least 2 questions — cover all topics
- Grade ${gradeNum} appropriate language and difficulty
- Use South African context and examples where relevant
- Questions must test understanding, not just recall
- Do NOT include any text outside the JSON array`;

  try {
    const geminiResponse = await callGemini(geminiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    });

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) throw new AppError('AI returned empty response', 500);

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    let questions: any[];
    try { questions = JSON.parse(jsonStr); }
    catch { throw new AppError('Failed to parse AI response', 500); }

    if (!Array.isArray(questions) || questions.length === 0) throw new AppError('No questions generated', 500);

    // Shuffle options so correct answer isn't always in same position
    for (const q of questions) {
      if (!q.options || q.correct === undefined) continue;
      const correctOption = q.options[q.correct];
      for (let i = q.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
      }
      q.correct = q.options.indexOf(correctOption);
      const labels = ['(A)', '(B)', '(C)', '(D)'];
      q.options = q.options.map((opt: string, i: number) => `${labels[i]} ${opt.replace(/^\([A-E]\)\s*/, '')}`);
    }

    const templateName = `${subject_name} Gr ${gradeNum} — Mock Assessment`;

    const template = await prisma.math_test_templates.create({
      data: {
        name: templateName,
        grade: gradeNum,
        subject_code: 'mock_assessment',
        operations: ['multiple_choice'],
        time_limit_sec: timeLimitSec,
        questions_json: questions as any,
        question_count: questions.length,
        language: lang,
        created_by: req.userId || null,
      },
    });

    res.json({
      id: template.id,
      name: template.name,
      grade: template.grade,
      subject_name,
      scope,
      time_limit_sec: template.time_limit_sec,
      question_count: template.question_count,
      questions: questions.map((q: any) => ({
        question_af: q.question_af,
        question_en: q.question_en,
        options: q.options,
        scope_topic: q.scope_topic,
        category: q.category,
      })),
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Mock assessment generation error:', err.message);
    throw new AppError('Failed to generate mock assessment. Please try again.', 500);
  }
});

// POST /api/subject-tests/tutor — Generate concept cards for any subject (tutoring mode)
router.post('/tutor', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { subject_code, grade, strand } = req.body;

  if (!subject_code || !grade) throw new AppError('subject_code and grade are required', 400);

  const config = SUBJECT_CONFIGS[subject_code];
  if (!config) throw new AppError(`Unknown subject: ${subject_code}`, 400);

  const gradeNum = parseInt(grade);
  if (!config.grades.includes(gradeNum)) {
    throw new AppError(`Grade ${grade} is not available for ${subject_code}`, 400);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  const prompt = buildTutorPrompt(subject_code, gradeNum, strand);

  try {
    const geminiResponse = await callGemini(geminiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }, 90000);

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) throw new AppError('AI returned empty response', 500);

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    const concepts = JSON.parse(jsonStr);
    if (!Array.isArray(concepts) || concepts.length === 0) throw new AppError('No concepts generated', 500);

    res.json({ concepts, subject_code, grade: gradeNum, strand: strand || 'all' });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Tutor generation error:', err.message);
    throw new AppError('Failed to generate lesson. Please try again.', 500);
  }
});

function buildTutorPrompt(subjectCode: string, grade: number, strand?: string): string {
  if (subjectCode === 'natural_science') {
    const isSenior = grade >= 7;
    const subjectName = isSenior ? 'Natural Sciences' : 'Natural Science and Technology';

    // Key concepts per strand per grade — covers ALL CAPS modules
    const strandTopics: Record<string, string> = {
      life_and_living: grade >= 8
        ? 'cell organelles (nucleus, mitochondria, chloroplast, vacuole, cell wall, cell membrane) and their functions; photosynthesis equation and reactants/products; cellular respiration vs photosynthesis; human nutrition (digestion, absorption); plant sexual reproduction (pollination, fertilisation, seed dispersal)'
        : 'plant cell vs animal cell (differences and similarities); photosynthesis (sunlight + CO₂ + H₂O → glucose + O₂); food webs and food chains (producer, consumer, decomposer); ecosystems and biomes; biodiversity; nutrient cycles (carbon cycle, water cycle)',
      matter_and_materials: grade >= 8
        ? 'atoms and molecules; elements vs compounds vs mixtures; first 20 elements of the periodic table with symbols; physical changes vs chemical changes; basic chemical equations (reactants → products); conservation of mass; acids and bases (pH scale, litmus)'
        : 'pure substances vs mixtures; solutions (solute, solvent, concentration, solubility); suspensions and colloids; separation techniques (filtration, evaporation, distillation, chromatography, sieving, magnetic separation); properties of materials',
      energy_and_change: grade >= 8
        ? 'static electricity (positive/negative charge, electrostatic force, conductors/insulators); Ohm\'s law (V = I × R, units); series vs parallel circuits (current and voltage behaviour); magnetic fields; electromagnetism; energy sources (renewable vs non-renewable)'
        : 'series circuits vs parallel circuits (current flow, voltage); energy conversions (electrical → heat → light → kinetic); conduction, convection and radiation; insulators and conductors; energy conservation; sound waves (vibration, medium, pitch, amplitude); light (reflection, refraction)',
      earth_and_beyond: grade >= 8
        ? 'earth\'s internal structure (crust, mantle, outer core, inner core); plate tectonics (tectonic plates, continental drift, Pangaea); seismic waves and earthquakes; volcanic activity; the solar system (planets, moons, asteroids, comets); the universe (stars, galaxies, light years)'
        : 'rock types (igneous, sedimentary, metamorphic) and the rock cycle; weathering (physical, chemical, biological) and erosion; soil formation and layers (horizons); South African biomes (grassland, fynbos, savanna, desert, forest); geological history; fossils and what they tell us',
    };

    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const strandLabel = selectedStrand
      ? selectedStrand.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'all four strands';
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || Object.values(strandTopics).join('; ')
      : Object.values(strandTopics).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : `Spread cards across all four categories: life_and_living, matter_and_materials, energy_and_change, earth_and_beyond`;

    return `You are a South African ${subjectName} tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering ${strandLabel} of the CAPS ${subjectName} curriculum.

Key concepts to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept or scientific term in English
- term_af: the term in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level definition in English (1–2 sentences)
- definition_af: the same definition in Afrikaans
- example_en: a real-world application or example using South African context
- example_af: the example in Afrikaans
- category: one of [life_and_living, matter_and_materials, energy_and_change, earth_and_beyond]

Return ONLY a valid JSON array:
[
  {
    "term_en": "Photosynthesis",
    "term_af": "Fotosintese",
    "definition_en": "The process by which green plants use sunlight, carbon dioxide and water to produce glucose and oxygen.",
    "definition_af": "Die proses waardeur groen plante sonlig, koolstofdioksied en water gebruik om glukose en suurstof te produseer.",
    "example_en": "The leaves of a marula tree in the Kruger National Park absorb sunlight to produce food through photosynthesis.",
    "example_af": "Die blare van 'n marulaboom in die Nasionale Krugerwildtuin absorbeer sonlig om kos deur fotosintese te produseer.",
    "category": "life_and_living"
  }
]

IMPORTANT:
- Definitions must be 100% scientifically accurate and at Grade ${grade} level
- Use South African context in examples (SA animals, plants, places, geography)
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'life_skills') {
    return `You are a South African Foundation Phase teacher creating concept cards for Grade ${grade} Beginning Knowledge.

Generate exactly 10 concept cards covering key topics from Life Skills: Beginning Knowledge (animals, plants, weather, body and health, safety).

For each card provide:
- term_en: the key concept or word in English (simple, Grade ${grade} level)
- term_af: in Afrikaans
- definition_en: what it is, in very simple Grade ${grade} language
- definition_af: in Afrikaans
- example_en: a fun real-world example a South African child would know
- example_af: in Afrikaans
- category: one of [animals, plants, weather, body_and_health, safety]

Return ONLY a valid JSON array with the same structure. Keep language very simple — Grade ${grade} reading level. Do NOT include any text outside the JSON array.`;
  }

  throw new AppError(`Tutoring not yet available for ${subjectCode}`, 400);
}

export default router;
