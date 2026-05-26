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

  creative_arts: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Creative Arts',
    nameAf: 'Skeppende Kunste',
    grades: [4,5,6,7,8,9],
    buildPrompt: (grade: number) => buildCreativeArtsPrompt(grade, 'visual_arts'),
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

  egd: {
    questionCount: 25,
    timeLimitSec: 2400,
    nameEn: 'Engineering Graphics and Design',
    nameAf: 'Ingenieurstekene en -Ontwerp',
    grades: [8,9,10,11,12],
    buildPrompt: (grade: number) => {
      const isFET = grade >= 10;
      const topics = isFET
        ? grade <= 10
          ? `  * Technical Drawing: orthographic projection (1st angle vs 3rd angle — symbol and layout), isometric drawing (isometric circles as ellipses), oblique projection (cavalier vs cabinet, receding angle), one-point and two-point perspective drawing
  * Geometric Drawing: constructing regular polygons (triangle, square, pentagon, hexagon, octagon), tangent constructions, ellipse (concentric circle method), conic sections
  * Solid Geometry: development (unfolding) of right prisms, cylinders, cones and pyramids; true shape of a cut surface; frustum development
  * Mechanical Drawing: conventional thread representations (external and internal), bolt-and-nut proportional drawing, keys and keyways, reading assembly drawings, bill of materials
  * Civil Drawing: reading floor plans (walls, doors, windows, rooms), front and side elevations, site plans (north point, setbacks, scale), scale calculations`
          : `  * Technical Drawing: auxiliary views (1st and 2nd auxiliary planes), true shape of oblique surfaces, advanced isometric and oblique, two-point perspective (measuring point method)
  * Geometric Drawing: advanced constructions (loci, cycloids, involutes, ellipse by trammel method, tangencies between circles), traces of lines and planes
  * Solid Geometry: interpenetration of solids (cylinder–cylinder, cylinder–prism, prism–prism), development of interpenetrating solids, truncated solids with oblique cuts
  * Descriptive Geometry: traces of lines and planes, inclinations to HP and VP, true length of oblique lines, true shape by revolution
  * Mechanical Drawing: detail drawings with ISO tolerances, surface finish and welding symbols, section views (full section, half section, removed section), assembly drawings
  * Civil Drawing: complete building set (floor plan, front and side elevations, cross-section, roof plan, site plan); structural drawings (foundations, columns, beams)`
        : `  * Drawing Standards: line types and their meaning (outline, hidden, centre, dimension, section), drawing instruments (compass, set squares, protractor, T-square, scale rule), SA drawing standards (SANS/ISO), title block information
  * Orthographic Projection: 1st angle projection; drawing top view, front view, side view of simple objects; reading 2D views to identify 3D shapes; interpreting hidden lines and centre lines
  * Isometric Drawing: isometric axes (30°), constructing 3D objects on isometric grid, isometric circles (ellipses), isometric dimensioning
  * Oblique Drawing: cavalier (full depth) vs cabinet (half depth) oblique; receding angle (30° or 45°); drawing simple 3D objects
  * Geometric Construction: bisecting lines and angles, constructing perpendiculars, tangent to a circle, regular polygons (hexagon, octagon), arcs of tangency`;

      return `You are a South African Engineering Graphics and Design (EGD) teacher creating a theory and knowledge practice test for Grade ${grade}.

Generate exactly 25 multiple choice questions. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS EGD curriculum
- Test knowledge of drawing conventions, theory, terminology, and interpretation
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
    "category": "technical_drawing"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Focus on THEORY and KNOWLEDGE — not "draw this" tasks (these are MCQ)
- Test terminology (What is cavalier oblique? What does a hidden line represent? What symbol identifies 1st angle projection?)
- Test standards (SANS/ISO line types, projection symbols, drawing conventions)
- Test interpretation (What view does this describe? What does this symbol mean?)
- Use South African CAPS EGD context and SANS/ISO standards
- Grade ${grade} appropriate difficulty
- Do NOT include any text outside the JSON array`;
    },
  },
};

// Creative Arts strand prompt (Visual Arts, Music, Drama, Dance)
function buildCreativeArtsPrompt(grade: number, strand: string): string {
  const isSenior = grade >= 7;

  const strands: Record<string, { label: string; topics: string }> = {
    visual_arts: {
      label: 'Visual Arts',
      topics: isSenior
        ? `elements of art (line, shape, colour, texture, space, value, form) and how artists use them; principles of design (balance, contrast, emphasis, rhythm, unity, proportion, movement); colour theory (complementary, analogous, split-complementary schemes; tints and shades); art history: Renaissance (Leonardo da Vinci, Michelangelo), Impressionism (Monet, Renoir), Cubism (Picasso); SA artists: Irma Stern, Gerard Sekoto, William Kentridge, Pierneef; art techniques: watercolour, acrylic, printmaking, sculpture, collage; composition and the rule of thirds; graphic design principles`
        : `elements of art: line (types and uses), shape (geometric vs organic), colour (primary, secondary, tertiary), texture (tactile vs visual), space (positive and negative); colour wheel: primary (red, blue, yellow), secondary (orange, green, purple), warm vs cool colours, complementary colours; SA traditional art: Ndebele geometric patterns and symbolism, San/Bushman rock art (Drakensberg), Zulu beadwork colour meanings, Sotho murals; basic drawing techniques: sketching, shading, proportion; famous artworks and their artists`,
    },
    music: {
      label: 'Music',
      topics: isSenior
        ? `music notation: reading rhythms (crotchet=1 beat, minim=2 beats, semibreve=4 beats, quaver=½ beat), time signatures (2/4, 3/4, 4/4, 6/8), rests, key signatures (major/minor); music forms: binary (AB), ternary (ABA), rondo (ABACADA), theme and variations; music periods: Baroque (Bach, Handel), Classical (Mozart, Beethoven), Romantic (Chopin, Brahms); SA music history: marabi and early township jazz, mbaqanga, kwaito, amapiano; SA icons: Hugh Masekela (flugelhorn/jazz), Miriam Makeba (Mama Africa, click song), Abdullah Ibrahim (Dollar Brand), Ladysmith Black Mambazo (isicathamiya/mbube); African music characteristics: call and response, polyrhythm, pentatonic scale, improvisation, community function`
        : `elements of music: rhythm (beat, tempo — fast/slow), melody (pitch — high/low), harmony, dynamics (forte/loud, piano/soft, crescendo, diminuendo), timbre (tone colour), texture (thick/thin); music notation basics: treble clef, note names (EGBDF, FACE), time signatures (2/4, 3/4, 4/4); instrument families: strings (violin, guitar, cello), woodwind (flute, clarinet, saxophone), brass (trumpet, trombone), percussion (drums, marimba, xylophone); SA music genres: gospel, kwaito, maskandi, marabi; SA musicians: Ladysmith Black Mambazo, Miriam Makeba; voice types: soprano, alto, tenor, bass`,
    },
    drama: {
      label: 'Drama',
      topics: isSenior
        ? `theatre forms: tragedy (protagonist falls due to flaw), comedy (humorous resolution), farce (exaggerated comedy), melodrama (heightened emotion), physical theatre, musical theatre; dramatic conventions: soliloquy (character alone speaks thoughts aloud), monologue (long speech to others), aside (spoken to audience not other characters), dramatic irony (audience knows more than characters), flashback, narrator; staging: blocking (movement on stage), stage areas (upstage, downstage, stage left/right), proscenium/thrust/theatre-in-the-round staging; SA theatre: Athol Fugard (Sizwe Banzi is Dead, Master Harold and the Boys), Mbongeni Ngema (Sarafina!), Barney Simon; devised theatre; Bertolt Brecht and Epic Theatre`
        : `elements of drama: character (protagonist, antagonist, supporting), plot (exposition, rising action, climax, falling action, resolution), setting (time and place), conflict (person vs person/self/nature/society), theme (central message); drama techniques: mime (acting without words), improvisation (unscripted performance), role play, freeze frame, hot seating (questioning a character); playwriting basics: stage directions, dialogue, scenes and acts; SA performance traditions: praise poetry (izibongo), storytelling (iintsomi), community theatre; body and voice in performance: posture, gesture, facial expression, projection, pace, pause`,
    },
    dance: {
      label: 'Dance',
      topics: isSenior
        ? `elements of dance: body (body parts, actions — locomotor and non-locomotor), space (level, direction, pathway, size), time (tempo, rhythm, duration), energy (force, flow — bound/free), relationships (unison, canon, mirroring, contrast); dance styles: African (polyrhythm, improvisation, community function, grounded movement), contemporary (modern technique, floor work, release technique), jazz (syncopation, isolations, commercial style), hip-hop (breaking, locking, popping), ballet (classical vocabulary); SA traditional dances: Zulu indlamu (stamping, warriors), Zulu ingoma (women's dance), Xhosa umtshotsho, Sotho moribelo, Venda tshigombela, Ndebele traditional ceremonies; SA dance companies and choreographers; choreographic devices: motif and development, repetition, canon, accumulation, retrograde`
        : `elements of dance: body (what moves), space (where you move — levels: low/middle/high; directions: forward/backward/sideways; pathways: straight/curved/zigzag), time (how fast or slow — beat, rhythm, tempo), energy (how you move — smooth/sharp, heavy/light, fast/slow); SA traditional dances: Zulu indlamu (stamping warrior dance), Xhosa dances and ululation, Sotho moribelo, Venda tshigombela, Cape Malay ghoema; dance health and safety: warming up, cooling down, stretching safely, preventing injury, hydration; basic dance steps and terminology: gallop, skip, chassé, step-touch, grapevine; dance in SA culture: celebration, storytelling, community, ritual`,
    },
  };

  const s = strands[strand] || strands.visual_arts;

  return `You are a South African Creative Arts teacher creating a ${s.label} theory practice test for Grade ${grade} learners.

Generate exactly 20 multiple choice questions testing ${s.label} knowledge and theory.

Cover these topics:
  ${s.topics}

Each question must:
- Be appropriate for Grade ${grade} SA CAPS Creative Arts (${s.label}) curriculum
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
- Use South African context and artists/musicians/performers throughout
- Mix knowledge questions with application questions (e.g. identify, analyse, describe)
- Grade ${grade} appropriate vocabulary and difficulty
- Do NOT include any text outside the JSON array`;
}

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

// Subjects available in Cambridge and IEB (core academic subjects only)
const CAMBRIDGE_SUBJECTS = new Set(['mathematics', 'english', 'natural_science', 'social_sciences']);
const IEB_SUBJECTS = new Set(['mathematics', 'english', 'afrikaans', 'natural_science', 'social_sciences', 'life_orientation']);

function buildCambridgeTestPrompt(subject_code: string, grade: number, strand?: string): string {
  const level = grade <= 6 ? 'Primary' : grade <= 9 ? 'Lower Secondary' : 'IGCSE';
  const qCount = grade <= 3 ? 20 : 30;

  const subjectPrompts: Record<string, string> = {
    mathematics: (() => {
      const topics: Record<number, string> = {
        1: `Number (counting 1–100, addition and subtraction to 20, shapes, simple patterns, measuring length)`,
        2: `Number (place value to 100, addition/subtraction to 100, multiplication as grouping, fractions halves/quarters, shapes, money, time)`,
        3: `Number (place value to 1000, multiplication/division facts to 5×5, fractions, decimals: 0.5, measurement, bar charts)`,
        4: `Number (place value to 10 000, multiplication/division to 10×10, fractions and decimals, area and perimeter, angles, data handling)`,
        5: `Number (integers, multiples, factors, prime numbers, fractions, decimals, percentages, negative numbers), Geometry (angles in shapes, 2D/3D shapes), Data (pie charts, mean)`,
        6: `Number (ratio, proportion, percentage, order of operations, sequences), Algebra (simple expressions, equations), Geometry (area, volume, angles on parallel lines), Statistics`,
        7: `Number (powers, standard form, fractions, percentages, direct/inverse proportion), Algebra (expressions, linear equations, sequences — nth term), Geometry (Pythagoras, trigonometry ratios intro, mensuration), Statistics (mean/median/mode from frequency tables, probability)`,
        8: `Number (surds, laws of indices, standard form), Algebra (factorising, simultaneous equations, inequalities, quadratics intro), Geometry (Pythagoras, trigonometry, circle theorems intro, vectors), Statistics (histograms, cumulative frequency, probability)`,
        9: `Number (rational/irrational, surds), Algebra (quadratics, functions, graphs, algebraic fractions), Geometry (circle theorems, transformations, trigonometry — sine/cosine rule), Statistics (scatter graphs, box plots, probability trees)`,
      };
      const topicText = topics[grade] || topics[9];
      return `You are a Cambridge International ${level} Mathematics teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following the Cambridge International ${level} Mathematics curriculum.

Cover these topics:
  ${topicText}

Each question must:
- Follow Cambridge International ${level} style — skills-based, analytical, include calculation questions
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans
- Include worked-out answer options for calculation questions

Return ONLY a valid JSON array:
[
  {
    "question_af": "Afrikaanse vraag...",
    "question_en": "English question...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "number"
  }
]

IMPORTANT:
- Use international context (do NOT limit to South African examples — use global examples)
- First ${Math.floor(qCount / 2)} questions easier, last ${qCount - Math.floor(qCount / 2)} harder
- Mix conceptual and calculation questions
- Do NOT include any text outside the JSON array`;
    })(),

    english: (() => {
      const topics = grade <= 6
        ? `Vocabulary (word meanings, synonyms, antonyms, context clues); Reading comprehension (main idea, inference, sequencing, cause and effect); Grammar (sentence structure, tenses — simple/continuous/perfect, punctuation, direct/indirect speech); Spelling and phonics`
        : `Reading comprehension (inference, analysis, author's purpose, figurative language — metaphor, simile, personification, irony); Grammar (tenses, active/passive voice, sentence types, direct/indirect speech, modal verbs); Vocabulary in context; Writing conventions`;
      return `You are a Cambridge International ${level} English teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following the Cambridge International ${level} English curriculum.

Cover these topics:
  ${topics}

Each question must:
- Follow Cambridge International ${level} English style (British English spelling: colour, behaviour, recognise)
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in English only (Afrikaans translation for parents in question_af field)

Return ONLY a valid JSON array with "question_en" (the actual question), "question_af" (translation for parents), "options", "correct", "category".

IMPORTANT:
- All answer options must be in English
- For comprehension questions: include a short passage (2–4 sentences) in the question_en field, then ask a question about it
- Grade ${grade} appropriate Cambridge difficulty
- Do NOT include any text outside the JSON array`;
    })(),

    natural_science: (() => {
      const topics = grade <= 6
        ? `Living things (cells, life processes, food chains, habitats, plant reproduction, adaptation); Materials (properties, states of matter, changes, mixtures); Forces and energy (electricity, light, sound, forces); Earth and space (solar system, weather, rocks and soil)`
        : grade <= 9
          ? `Biology (cells, photosynthesis and respiration, ecosystems, reproduction); Chemistry (atoms, elements and compounds, periodic table intro, reactions, acids and bases, separation techniques); Physics (forces, energy, electricity, waves — light and sound)`
          : `Biology (inheritance, evolution, enzymes, human systems); Chemistry (atomic structure, bonding, stoichiometry, chemical energetics, electrolysis); Physics (mechanics, waves, electricity and magnetism, radioactivity)`;
      return `You are a Cambridge International ${level} Science teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following the Cambridge International ${level} Science (Combined Science / IGCSE) curriculum.

Cover these topics proportionally:
  ${topics}

Each question must:
- Follow Cambridge International ${level} Science style
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category" (use: biology, chemistry, physics).

IMPORTANT:
- Use international scientific context and examples
- Test understanding and application, not just recall
- Do NOT include any text outside the JSON array`;
    })(),

    social_sciences: (() => {
      const isHistory = !strand || strand === 'history';
      const topics = isHistory
        ? grade <= 6
          ? `Ancient civilisations (Egypt, Mesopotamia, Greece, Rome); Early human migration out of Africa; Medieval world; Age of Exploration`
          : grade <= 9
            ? `Imperialism and colonialism (19th century); World War I (causes, trench warfare, Treaty of Versailles); Rise of Hitler and fascism; World War II; Cold War beginnings`
            : `Cold War (containment, Korean War, Cuban Missile Crisis, Vietnam); Decolonisation in Africa and Asia; Civil rights movements; Apartheid and its global impact; End of Cold War and fall of Berlin Wall`
        : grade <= 6
          ? `Maps and globes (continents, oceans, coordinates); Physical features (rivers, mountains, climate zones); Weather and climate; Population and settlements`
          : grade <= 9
            ? `Map skills (scale, topographic maps, grid references, contour lines); Development indicators (HDI, GDP, poverty); Climate and biomes; Rivers and drainage; Population distribution`
            : `Advanced map work; Globalisation and trade; Climate change (causes and effects); Migration; Sustainable development; Resource management`;
      const strandLabel = isHistory ? 'History' : 'Geography';
      return `You are a Cambridge International ${level} ${strandLabel} teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following the Cambridge International ${level} ${strandLabel} curriculum.

Cover these topics:
  ${topics}

Each question must:
- Follow Cambridge International ${level} ${strandLabel} style
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category" (use: "${strand || 'history'}").

IMPORTANT:
- Use international historical/geographical examples (NOT South Africa exclusively)
- Include source-based and analytical questions where appropriate
- Do NOT include any text outside the JSON array`;
    })(),
  };

  return subjectPrompts[subject_code] || '';
}

function buildIEBTestPrompt(subject_code: string, grade: number, strand?: string): string {
  const qCount = grade <= 3 ? 20 : 30;

  const subjectPrompts: Record<string, string> = {
    mathematics: (() => {
      const topics: Record<number, string> = {
        8: `Number (rational/irrational numbers, exponents, scientific notation, surds intro); Algebra (polynomials, factorising, linear equations/inequalities, simultaneous equations); Geometry (Pythagoras, congruency, similarity, mensuration); Functions (linear, introduction to quadratic); Data Handling (statistics, probability)`,
        9: `Number (surds, laws of exponents, number patterns); Algebra (trinomial factorisation, algebraic fractions, quadratic equations, simultaneous equations); Functions (linear and quadratic graphs, parabola, hyperbola intro); Financial Maths (simple/compound interest); Geometry (proofs, circle geometry intro); Statistics and Probability`,
        10: `Algebra (quadratics, algebraic fractions, surds, exponents); Functions (parabola, exponential, hyperbola, logs intro); Trigonometry (sin/cos/tan, special angles, 2D problems); Euclidean Geometry (proofs, circles); Financial Maths; Statistics`,
        11: `Algebra (polynomials, complex fractions); Functions (trig functions — graphs and equations, log functions); Trigonometry (compound angles, 3D); Geometry (circles, proofs); Financial Maths (annuities); Calculus intro; Statistics (regression)`,
        12: `Algebra (sequences and series, sigma notation); Functions and Graphs (comprehensive); Trigonometry (proofs, general solutions); Euclidean Geometry (proofs); Calculus (limits, differentiation, integration, optimisation); Financial Maths (annuities, future value); Statistics and Probability`,
      };
      const topicText = topics[grade] || (grade < 8 ? `Number, Algebra, Geometry, Data Handling — Grade ${grade} IEB level` : topics[12]);
      return `You are an IEB (Independent Examinations Board) Mathematics teacher creating a rigorous practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following IEB Mathematics curriculum standards.

Cover these topics:
  ${topicText}

Each question must:
- Follow IEB examination style — higher cognitive demand, multi-step, application-focused
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans
- Include calculation questions requiring working (show answers as simplified values)

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category".

IMPORTANT:
- IEB standard is MORE rigorous than CAPS — include challenging multi-step problems
- Use South African context where relevant
- Last 10 questions must be at higher cognitive level (analysis, synthesis, application)
- Do NOT include any text outside the JSON array`;
    })(),

    english: (() => `You are an IEB English Home Language teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following IEB English Home Language standards.

Cover:
  Reading comprehension (deep inference, analysis, literary devices — irony, symbolism, allusion; tone and mood); Grammar (complex sentences, tenses, voice, reported speech, punctuation); Vocabulary (register, connotation, idiomatic expressions, literary terms); Language use and context

Each question must:
- Follow IEB examination style — analytical, critical thinking
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in English (with Afrikaans translation in question_af for parents)

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category".
Include a short passage for comprehension questions. Grade ${grade} IEB difficulty. Do NOT include any text outside the JSON array`)(),

    afrikaans: (() => `You is 'n IEB Afrikaans Huistaal-onderwyser wat 'n oefentoets vir Graad ${grade} leerders skep.

Genereer presies ${qCount} meervoudigekeuse-vrae volgens IEB Afrikaans Huistaal-standaard.

Dek:
  Begripslees (inferensie, analise, literêre middele — ironie, simbool, toon, stemming); Taal (sinskonstruksie, tydvorme, direkte/indirekte rede, leestekens); Woordeskat (register, konnotasie, idiome, spreekwoorde)

Elke vraag moet:
- IEB-eksamenformaat volg — analities, hoë kognitiewe vlak
- Presies 4 opsies hê: (A), (B), (C), (D)
- SLEGS EEN korrekte antwoord hê
- In Afrikaans wees (question_af = die vraag, question_en = Engelse vertaling vir ouers)

Gee SLEGS 'n geldige JSON-skikking terug met "question_en", "question_af", "options", "correct", "category". Sluit 'n kort teksgedeelte in vir begripstoetsing. Graad ${grade} IEB-vlak. Geen teks buite die JSON nie`)(),

    natural_science: (() => {
      const isPhysical = !strand || strand === 'all' || grade >= 10;
      const topics = grade <= 9
        ? `Life Sciences (cells, ecosystems, photosynthesis, respiration, reproduction, biodiversity); Physical Sciences (matter and materials, atoms, chemical reactions, electricity, mechanics, waves)`
        : grade === 10
          ? `Physical Sciences: Matter and Materials (atomic structure, periodic table, chemical bonding); Mechanics (Newton's Laws, energy, momentum); Waves (electromagnetic spectrum, Doppler). Life Sciences: Biochemistry (organic molecules), Cell biology, Genetics intro`
          : `Physical Sciences: Quantitative aspects of chemical change, Electrostatics, Circuits, Electrodynamics, Chemical equilibrium, Acids and bases. Life Sciences: Genetics and DNA, Evolution, Human impact on environment`;
      return `You are an IEB ${grade >= 10 ? 'Physical Sciences and Life Sciences' : 'Natural Sciences'} teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following IEB ${grade >= 10 ? 'Physical Sciences / Life Sciences' : 'Natural Sciences'} curriculum.

Cover these topics:
  ${topics}

Each question must:
- Follow IEB examination style — rigorous, analytical, application and higher-order thinking
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category" (use: biology, chemistry, physics).

IMPORTANT:
- IEB standard is more rigorous than CAPS — include application and analysis questions
- Use South African context (SA biomes, SA energy challenges, Eskom, water issues)
- Do NOT include any text outside the JSON array`;
    })(),

    social_sciences: (() => {
      const isHistory = !strand || strand === 'history';
      const topics = isHistory
        ? grade <= 9
          ? `SA history: colonialism and resistance, apartheid laws (Group Areas Act, Population Registration Act), Defiance Campaign, Sharpeville, ANC/PAC/BCM; World History: Cold War, decolonisation, civil rights movements`
          : `SA history: apartheid (1948–1994 in depth), resistance movements, transition to democracy; World history: causes of apartheid; historiography; source analysis methodology`
        : grade <= 9
          ? `SA geography: biomes, resources, urbanisation, population; Map work: topographic maps, cross-sections; Development: HDI, development gaps`
          : `Advanced map work; Climate change: SA impact, mitigation; Globalisation; Migration patterns; Resource management; Sustainable development`;
      const strandLabel = isHistory ? 'History' : 'Geography';
      return `You are an IEB Social Sciences ${strandLabel} teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following IEB ${strandLabel} curriculum standards.

Cover these topics:
  ${topics}

Each question must:
- Follow IEB examination style — analytical, source-based where appropriate, higher-order thinking
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category" (use: "${strand || 'history'}").

IMPORTANT:
- IEB ${strandLabel} is more rigorous than CAPS — include analysis and evaluation questions
- Use South African context extensively
- Do NOT include any text outside the JSON array`;
    })(),

    life_orientation: (() => `You are an IEB Life Orientation teacher creating a practice test for Grade ${grade} learners.

Generate exactly ${qCount} multiple choice questions following IEB Life Orientation curriculum.

Cover:
  Personal development (identity, resilience, mental health, relationships); Social issues (gender-based violence, substance abuse, HIV/AIDS, human rights — SA Constitution and Bill of Rights); Career planning and the world of work; Democracy and active citizenship; Physical well-being

Each question must:
- Follow IEB LO style — scenario-based, analytical, application of knowledge
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH English AND Afrikaans

Return ONLY a valid JSON array with "question_en", "question_af", "options", "correct", "category". Grade ${grade} IEB LO difficulty. SA context essential. Do NOT include any text outside the JSON array`)(),
  };

  return subjectPrompts[subject_code] || '';
}

function buildCambridgeTutorPrompt(subject_code: string, grade: number, strand?: string): string {
  const level = grade <= 6 ? 'Primary' : grade <= 9 ? 'Lower Secondary' : 'IGCSE';
  const NATIVE_MARKER = '{{NATIVE_LANG_BLOCK}}';

  const subjects: Record<string, string> = {
    mathematics: `You are a Cambridge International ${level} Mathematics tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Cambridge ${level} Maths topics for Grade ${grade}.

For each card provide:
- term_en: the key concept or formula in English
- term_af: in Afrikaans
- definition_en: clear explanation at Grade ${grade} Cambridge ${level} level
- definition_af: in Afrikaans
- example_en: a worked example (international context — no SA context required)
- example_af: in Afrikaans
- category: one of [number, algebra, geometry, statistics]

Return ONLY a valid JSON array. Cambridge ${level} curriculum, international examples. Do NOT include any text outside the JSON array`,

    english: `You are a Cambridge International ${level} English tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Cambridge ${level} English skills.

For each card provide:
- term_en: the concept or literary term in English (British English spelling)
- term_af: in Afrikaans
- definition_en: clear explanation with examples of the term
- definition_af: in Afrikaans
- example_en: a sentence or passage showing the term in use
- example_af: in Afrikaans
- category: one of [comprehension, grammar, vocabulary, writing]

Return ONLY a valid JSON array. Cambridge style, British English. Do NOT include any text outside the JSON array`,

    natural_science: `You are a Cambridge International ${level} Science tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Cambridge ${level} Science topics.

For each card provide:
- term_en: the scientific term or concept
- term_af: in Afrikaans
- definition_en: accurate Grade ${grade} Cambridge ${level} definition
- definition_af: in Afrikaans
- example_en: a real-world application or example (international context)
- example_af: in Afrikaans
- category: one of [biology, chemistry, physics]

Return ONLY a valid JSON array. Cambridge curriculum, accurate science. Do NOT include any text outside the JSON array`,

    social_sciences: (() => {
      const isHistory = !strand || strand === 'history';
      return `You are a Cambridge International ${level} ${isHistory ? 'History' : 'Geography'} tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering Cambridge ${level} ${isHistory ? 'History' : 'Geography'} concepts.

For each card provide:
- term_en: the historical/geographical term or concept
- term_af: in Afrikaans
- definition_en: accurate Cambridge ${level} level explanation
- definition_af: in Afrikaans
- example_en: a relevant international example
- example_af: in Afrikaans
- category: "${strand || 'history'}"

Return ONLY a valid JSON array. Cambridge curriculum. Do NOT include any text outside the JSON array`;
    })(),
  };

  return subjects[subject_code] || '';
}

function buildIEBTutorPrompt(subject_code: string, grade: number, strand?: string): string {
  const subjects: Record<string, string> = {
    mathematics: `You are an IEB Mathematics tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key IEB Grade ${grade} Maths concepts.

For each card provide:
- term_en: the key concept, theorem, or formula in English
- term_af: in Afrikaans
- definition_en: rigorous Grade ${grade} IEB-level explanation — include formula and rules
- definition_af: in Afrikaans
- example_en: a worked multi-step example (SA context where relevant)
- example_af: in Afrikaans
- category: one of [algebra, geometry, functions, statistics, financial]

Return ONLY a valid JSON array. IEB standard — more rigorous than CAPS. South African context. Do NOT include any text outside the JSON array`,

    english: `You are an IEB English Home Language tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key IEB English skills.

For each card:
- term_en: the concept or literary/language term
- term_af: in Afrikaans
- definition_en: IEB-level explanation with examples
- definition_af: in Afrikaans
- example_en: example from South African literature or context where possible
- example_af: in Afrikaans
- category: one of [comprehension, grammar, vocabulary, literary_terms]

Return ONLY a valid JSON array. IEB standard, SA context. Do NOT include any text outside the JSON array`,

    afrikaans: `Jy is 'n IEB Afrikaans Huistaal-tutor wat konsepkaarte vir Graad ${grade} leerders skep.

Genereer presies 10 konsepkaarte wat sleutel IEB Afrikaans-konsepte dek.

Vir elke kaart:
- term_en: Engelse term
- term_af: Afrikaanse term of konsep
- definition_en: Engelse verduideliking
- definition_af: IEB-vlak Afrikaanse verduideliking met voorbeelde
- example_en: Engelse voorbeeld
- example_af: Voorbeeld uit SA Afrikaanse letterkunde of konteks
- category: een van [begrip, taal, woordeskat, letterkunde]

Gee SLEGS 'n geldige JSON-skikking terug. IEB-standaard, SA konteks. Geen teks buite die JSON nie`,

    natural_science: `You are an IEB ${grade >= 10 ? 'Physical Sciences and Life Sciences' : 'Natural Sciences'} tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key IEB science concepts for Grade ${grade}.

For each card:
- term_en: the scientific concept or formula
- term_af: in Afrikaans
- definition_en: rigorous IEB-level definition — include formulae and laws where applicable
- definition_af: in Afrikaans
- example_en: application example with South African context
- example_af: in Afrikaans
- category: one of [biology, chemistry, physics]

Return ONLY a valid JSON array. IEB standard, SA context. Do NOT include any text outside the JSON array`,

    social_sciences: (() => {
      const isHistory = !strand || strand === 'history';
      return `You are an IEB Social Sciences ${isHistory ? 'History' : 'Geography'} tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key IEB ${isHistory ? 'History' : 'Geography'} concepts.

For each card:
- term_en: the historical/geographical concept, term, or law
- term_af: in Afrikaans
- definition_en: IEB-level analytical explanation — cause, effect, significance
- definition_af: in Afrikaans
- example_en: SA and/or global example with analytical depth
- example_af: in Afrikaans
- category: "${strand || 'history'}"

Return ONLY a valid JSON array. IEB standard, SA context primary. Do NOT include any text outside the JSON array`;
    })(),

    life_orientation: `You are an IEB Life Orientation tutor creating concept cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key IEB LO topics.

For each card:
- term_en: the concept or law/right/principle
- term_af: in Afrikaans
- definition_en: IEB LO explanation with SA legal/social context
- definition_af: in Afrikaans
- example_en: SA scenario-based example
- example_af: in Afrikaans
- category: one of [personal, social, career, democracy, physical]

Return ONLY a valid JSON array. IEB LO, SA context essential. Do NOT include any text outside the JSON array`,
  };

  return subjects[subject_code] || '';
}

// POST /api/subject-tests/generate — Generate AI test for any subject
router.post('/generate', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { subject_code, grade, language, strand, curriculum } = req.body;

  if (!subject_code || !grade) {
    throw new AppError('subject_code and grade are required', 400);
  }

  // Subscription gate — OWNER/ADMIN bypass, free tier blocked
  if (req.userId && req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
    const sub = await prisma.grade_subscriptions.findUnique({ where: { auth_user_id: req.userId } });
    const isActive = sub?.status === 'active' && (!sub.expires_at || sub.expires_at > new Date());
    const plan = isActive ? sub!.plan : 'free';

    if (plan === 'free') {
      throw new AppError('Upgrade your plan to access AI subject tests', 403);
    }
    if ((plan === 'per_subject' || plan === 'three_subjects') && sub!.subjects.length > 0) {
      if (!sub!.subjects.includes(subject_code)) {
        throw new AppError(`Your plan doesn't include ${subject_code}`, 403);
      }
    }
  } else if (!req.userId) {
    throw new AppError('Please sign in to generate subject tests', 401);
  }

  const gradeNum = parseInt(grade);
  const effectiveCurriculum = curriculum || 'caps';

  // For Cambridge/IEB, validate subject is supported and build curriculum-specific prompt
  if (effectiveCurriculum === 'cambridge') {
    if (!CAMBRIDGE_SUBJECTS.has(subject_code)) {
      throw new AppError(`${subject_code} is not available in the Cambridge curriculum. Supported subjects: Mathematics, English, Science, History, Geography.`, 400);
    }
  } else if (effectiveCurriculum === 'ieb') {
    if (!IEB_SUBJECTS.has(subject_code)) {
      throw new AppError(`${subject_code} is not available in the IEB curriculum. Supported subjects: Mathematics, English, Afrikaans, Science, History, Geography, Life Orientation.`, 400);
    }
  }

  const config = SUBJECT_CONFIGS[subject_code];
  if (!config) {
    throw new AppError(`Unknown subject: ${subject_code}`, 400);
  }

  if (effectiveCurriculum === 'caps' && !config.grades.includes(gradeNum)) {
    throw new AppError(`Grade ${grade} is not available for ${subject_code}`, 400);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new AppError('GEMINI_API_KEY not configured', 500);
  }

  let prompt = '';
  if (effectiveCurriculum === 'cambridge') {
    prompt = buildCambridgeTestPrompt(subject_code, gradeNum, strand);
    if (!prompt) throw new AppError(`Cambridge prompt not available for ${subject_code}`, 400);
  } else if (effectiveCurriculum === 'ieb') {
    prompt = buildIEBTestPrompt(subject_code, gradeNum, strand);
    if (!prompt) throw new AppError(`IEB prompt not available for ${subject_code}`, 400);
  } else {
    let strandPrompt = '';
    if (strand && subject_code === 'natural_science') {
      strandPrompt = buildNaturalScienceStrandPrompt(gradeNum, strand);
    } else if (strand && subject_code === 'social_sciences') {
      strandPrompt = buildSocialSciencesPrompt(gradeNum, strand);
    } else if (subject_code === 'creative_arts') {
      strandPrompt = buildCreativeArtsPrompt(gradeNum, strand || 'visual_arts');
    }
    prompt = strandPrompt || config.buildPrompt(gradeNum);
  }

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
      visual_arts: 'Visual Arts', music: 'Music', drama: 'Drama', dance: 'Dance',
    };
    const strandSuffix = strand && strandLabels[strand] ? ` — ${strandLabels[strand]}` : '';
    const curriculumPrefix = effectiveCurriculum !== 'caps' ? `${effectiveCurriculum.toUpperCase()} ` : '';
    const templateName = lang === 'af'
      ? `${curriculumPrefix}${config.nameAf} Gr ${grade}${strandSuffix}`
      : `${curriculumPrefix}${config.nameEn} Gr ${grade}${strandSuffix}`;

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
  const { language, level, home_language } = req.body;

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
- Do NOT include any text outside the JSON array${
  home_language && !['en', 'af'].includes(home_language) && NATIVE_LANG_NAMES[home_language]
    ? `\n\nADDITIONAL: For each word, also include:
- "translation_native": the translation in ${NATIVE_LANG_NAMES[home_language]}
- "pronunciation_native": pronunciation guide written for ${NATIVE_LANG_NAMES[home_language]} speakers (use ${NATIVE_LANG_NAMES[home_language]} phonetics and familiar sounds, NOT English phonetics)

These are for learners whose home language is ${NATIVE_LANG_NAMES[home_language]}. Translations must be ACCURATE.`
    : ''
}`;

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

  if (!subject_name || !grade) {
    throw new AppError('subject_name and grade are required', 400);
  }
  const gradeNum = parseInt(grade);
  if (gradeNum < 1 || gradeNum > 12) throw new AppError('Grade must be 1–12', 400);

  const effectiveScope = Array.isArray(scope) && scope.length > 0 ? (scope as string[]) : null;
  if (effectiveScope && effectiveScope.length > 10) throw new AppError('Maximum 10 topics per mock assessment', 400);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  const lang = language || 'en';
  const optionsLang = lang === 'afrikaans' ? 'Afrikaans' : 'English';
  const qCount = effectiveScope ? Math.min(Math.max(effectiveScope.length * 4, 12), 30) : 30;
  const timeLimitSec = qCount * 90;

  const prompt = effectiveScope
    ? (() => {
        const scopeList = effectiveScope.map((t, i) => `${i + 1}. ${t}`).join('\n');
        return `You are a South African ${subject_name} teacher creating a personalised mock exam for Grade ${gradeNum} learners.

The learner's study scope for this exam:
${scopeList}

Generate exactly ${qCount} multiple choice questions. Distribute questions as evenly as possible across ALL topics — every topic must appear in at least 2 questions.

Each question must:
- Be appropriate for Grade ${gradeNum} South African CAPS curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- question_en = English version, question_af = Afrikaans version
- ALL answer options (A), (B), (C), (D) must be written in ${optionsLang} ONLY
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
      })()
    : `You are a South African ${subject_name} teacher creating a broad mock exam for Grade ${gradeNum} learners.

Generate exactly 30 multiple choice questions covering the full Grade ${gradeNum} SA CAPS ${subject_name} curriculum.

Each question must:
- Be appropriate for Grade ${gradeNum} South African CAPS curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- question_en = English version, question_af = Afrikaans version
- ALL answer options (A), (B), (C), (D) must be written in ${optionsLang} ONLY
- Cover a broad range of CAPS topics for this subject and grade

Return ONLY a valid JSON array:
[
  {
    "question_en": "...",
    "question_af": "...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "scope_topic": "general",
    "category": "general"
  }
]

IMPORTANT:
- Cover the full breadth of the Grade ${gradeNum} ${subject_name} CAPS curriculum
- First 15 questions easier, last 15 harder
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

const NATIVE_LANG_NAMES: Record<string, string> = {
  zu: 'IsiZulu', xh: 'IsiXhosa', tn: 'Setswana', nso: 'Sepedi',
  st: 'Sesotho', ve: 'Tshivenḓa', ss: 'Siswati', ts: 'Xitsonga', nr: 'isiNdebele',
};

// POST /api/subject-tests/tutor — Generate concept cards for any subject (tutoring mode)
router.post('/tutor', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { subject_code, grade, strand, native_language, curriculum } = req.body;

  if (!subject_code || !grade) throw new AppError('subject_code and grade are required', 400);

  // Subscription gate
  if (req.userId && req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
    const prisma = getPrisma(req);
    const sub = await prisma.grade_subscriptions.findUnique({ where: { auth_user_id: req.userId } });
    const isActive = sub?.status === 'active' && (!sub.expires_at || sub.expires_at > new Date());
    const plan = isActive ? sub!.plan : 'free';

    if (plan === 'free') throw new AppError('Upgrade your plan to access study mode', 403);
    if ((plan === 'per_subject' || plan === 'three_subjects') && sub!.subjects.length > 0) {
      if (!sub!.subjects.includes(subject_code)) throw new AppError(`Your plan doesn't include ${subject_code}`, 403);
    }
  } else if (!req.userId) {
    throw new AppError('Please sign in to use study mode', 401);
  }

  const gradeNum = parseInt(grade);
  const effectiveCurriculum = curriculum || 'caps';

  const config = SUBJECT_CONFIGS[subject_code];
  if (!config) throw new AppError(`Unknown subject: ${subject_code}`, 400);

  if (effectiveCurriculum === 'caps' && !config.grades.includes(gradeNum)) {
    throw new AppError(`Grade ${grade} is not available for ${subject_code}`, 400);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  let basePrompt = '';
  if (effectiveCurriculum === 'cambridge') {
    basePrompt = buildCambridgeTutorPrompt(subject_code, gradeNum, strand);
    if (!basePrompt) throw new AppError(`Cambridge tutor not available for ${subject_code}`, 400);
  } else if (effectiveCurriculum === 'ieb') {
    basePrompt = buildIEBTutorPrompt(subject_code, gradeNum, strand);
    if (!basePrompt) throw new AppError(`IEB tutor not available for ${subject_code}`, 400);
  } else {
    basePrompt = buildTutorPrompt(subject_code, gradeNum, strand);
  }
  const nativeName = native_language ? NATIVE_LANG_NAMES[native_language] : null;
  const prompt = nativeName
    ? basePrompt + `\n\nADDITIONAL REQUIREMENT — MOTHER TONGUE EDUCATION:
For every card in the JSON array, also include these three fields:
- "term_native": the key term translated accurately into ${nativeName}
- "definition_native": the definition translated accurately into ${nativeName} (clear, grade-appropriate)
- "example_native": the example translated accurately into ${nativeName}

These translations are for learners whose home language is ${nativeName}. Accuracy is critical — use real, correct ${nativeName} vocabulary and grammar.`
    : basePrompt;

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

  if (subjectCode === 'mathematics') {
    const strandTopics: Record<string, string> = {
      numbers: grade === 7
        ? 'integers (positive, negative, absolute value); fractions, decimals, percentages (conversion and operations); exponents (squares, cubes, square roots); scientific notation; ratio and proportion'
        : grade === 8
          ? 'rational vs irrational numbers; integer exponents (laws: product, quotient, power of a power); scientific notation; square roots and cube roots; ordering real numbers on a number line'
          : 'surds (simplify, rationalise); laws of exponents with rational exponents; number patterns and sequences; arithmetic and geometric sequences',
      algebra: grade === 7
        ? 'algebraic expressions (terms, coefficients, like terms); simplifying expressions; substitution; expanding brackets; simple linear equations (solving for x); word problems to equations'
        : grade === 8
          ? 'factorising (common factor, difference of squares); product of two binomials (FOIL); linear equations and inequalities; simultaneous equations (substitution method); algebraic fractions'
          : 'factorising trinomials; difference of squares; algebraic fractions; quadratic equations (factorisation method); simultaneous equations (elimination and substitution); inequalities on a number line',
      geometry: grade === 7
        ? 'types of angles (acute, obtuse, reflex, supplementary, complementary, vertically opposite, co-interior, alternate); properties of triangles (equilateral, isosceles, scalene); quadrilaterals; perimeter and area of 2D shapes; volume and surface area basics'
        : grade === 8
          ? 'theorem of Pythagoras (a²+b²=c²) and its applications; similar vs congruent triangles; properties of quadrilaterals (parallelogram, rhombus, rectangle, square, trapezium); area, perimeter; surface area and volume of prisms and cylinders'
          : 'congruency and similarity theorems; Pythagoras in 3D problems; surface area and volume of pyramids, cones, spheres; formal geometric proofs; trigonometry basics (sin, cos, tan ratios in right-angled triangles)',
      functions: grade >= 8
        ? grade === 8
          ? 'input-output relationships; linear functions (y = mx + c); gradient (positive, negative, zero, undefined); y-intercept and x-intercept; plotting linear functions on Cartesian plane; interpreting graphs'
          : 'linear functions: gradient, y-intercept, finding equations; quadratic functions (y = ax²): shape, vertex, intercepts; inverse proportion (y = a/x); plotting and interpreting graphs; finding equations from graphs'
        : 'basic input-output tables; Cartesian plane (x and y axes, quadrants, plotting points); straight-line graphs through the origin',
      data: 'mean, median, mode, range — calculating and interpreting; frequency tables and tally charts; bar graphs, pie charts, histograms, line graphs — drawing and interpreting; scatter plots (Gr 9); probability (theoretical vs experimental); probability scale 0 to 1; tree diagrams for compound events',
      financial: 'simple interest formula (A = P(1 + in)); compound interest formula (A = P(1 + i)ⁿ); hire purchase (deposit, monthly instalment, total cost); exchange rates (converting rands to other currencies); inflation; income tax basics',
    };

    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || Object.values(strandTopics).slice(0, 4).join(';\n  ')
      : Object.values(strandTopics).slice(0, 4).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : 'Spread cards across categories: numbers, algebra, geometry, data';

    return `You are a South African Mathematics tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Mathematics concepts for Grade ${grade} SA CAPS.

Key concepts to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, formula, or mathematical term in English
- term_af: in Afrikaans (use correct SA maths terminology)
- definition_en: a clear, accurate Grade ${grade}-level explanation in English — include the formula or rule if applicable
- definition_af: the same in Afrikaans
- example_en: a worked example with actual numbers showing how it works
- example_af: the worked example in Afrikaans
- category: one of [numbers, algebra, geometry, functions, data, financial]

Return ONLY a valid JSON array:
[
  {
    "term_en": "Pythagoras' Theorem",
    "term_af": "Stelling van Pythagoras",
    "definition_en": "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c².",
    "definition_af": "In 'n reghoekige driehoek is die kwadraat van die skuinssy gelyk aan die som van die kwadrate van die ander twee sye: a² + b² = c².",
    "example_en": "If the two shorter sides are 3 cm and 4 cm, then c² = 9 + 16 = 25, so c = 5 cm.",
    "example_af": "As die twee korter sye 3 cm en 4 cm is, dan is c² = 9 + 16 = 25, dus c = 5 cm.",
    "category": "geometry"
  }
]

IMPORTANT:
- Always include the formula or rule in the definition where one exists
- Worked examples must use actual numbers, not just descriptions
- Grade ${grade} SA CAPS appropriate difficulty
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'life_orientation') {
    const strandTopics: Record<string, string> = {
      personal: grade >= 7
        ? 'self-concept and identity (factors that shape who we are); peer pressure (types, resisting pressure, healthy boundaries); decision-making models (SODAS: Situation, Options, Disadvantages, Advantages, Solution); goal setting (SMART goals); coping with stress; healthy relationships vs unhealthy relationships'
        : 'self-concept (strengths and weaknesses, self-esteem); emotions and how to manage them; peer relationships and friendships; values and how they guide our choices; personal boundaries',
      social: grade >= 7
        ? 'substance abuse in South Africa (alcohol, tobacco, drugs — effects on health and society, prevention strategies); gender-based violence (GBV) — recognising and reporting; environmental responsibility; community service and active citizenship; HIV/AIDS awareness and prevention'
        : 'family structure and roles; community helpers; diversity and inclusion (different cultures, religions, abilities); caring for the environment; community problems and solutions',
      rights: grade >= 7
        ? 'SA Constitution (Chapter 2 — Bill of Rights: key rights including equality, dignity, education, health); human rights violations and how to report them; gender equality; democracy and voting; responsibilities that come with rights; Chapter 9 institutions (Human Rights Commission, Gender Commission)'
        : 'learners\' rights and responsibilities at school; the SA flag, anthem, and national symbols; democracy (free and fair elections, majority rule, minority rights); community rules and laws',
      career: grade >= 7
        ? 'world of work (formal vs informal sector; self-employment vs employment); further education options (universities, colleges, TVET colleges); career planning (skills audit, interests, aptitude); CV and interview basics; entrepreneurship as a career choice'
        : 'different types of jobs and careers; skills and strengths (discovering what you are good at); interests and how they link to careers; studying and learning how to study; career research',
      physical: 'components of physical fitness (cardiovascular endurance, muscular strength, flexibility, coordination, agility); principles of training (FITT: Frequency, Intensity, Time, Type); rules and fair play in sport; safety in sport and physical activity; first aid basics (DRABC — Danger, Response, Airway, Breathing, Circulation)',
    };

    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || Object.values(strandTopics).join(';\n  ')
      : Object.values(strandTopics).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : 'Spread cards across: personal, social, rights, career, physical';

    return `You are a South African Life Orientation tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Life Orientation concepts for Grade ${grade} SA CAPS.

Key topics to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, term, or skill in English
- term_af: in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level explanation — include relevant laws, facts or steps if applicable
- definition_af: the same in Afrikaans
- example_en: a practical real-life scenario using South African context
- example_af: in Afrikaans
- category: one of [personal, social, rights, career, physical]

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- Use South African context (SA Constitution, Ubuntu, SA laws, local issues, SA sport)
- Scenario-based examples — show real situations learners would face
- Grade ${grade} appropriate language and complexity
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'social_sciences') {
    const isHistory = !strand || strand === 'all' || strand === 'history';
    const subjectName = isHistory ? 'History' : 'Geography';
    const category = isHistory ? 'history' : 'geography';

    const historyTopics: Record<number, string> = {
      4: 'early African societies (San/Khoikhoi hunter-gatherers and herders); Bantu-speaking farmers and their communities; early trade in southern Africa; oral traditions and how we know about the past',
      5: 'ancient civilisations: Egypt (pharaohs, pyramids, daily life); ancient Greece (city-states, democracy, the Olympics); early kingdoms in Africa (Mali Empire, Mansa Musa)',
      6: 'Portuguese exploration and arrival at the Cape (1488); Jan van Riebeeck and the Dutch East India Company (VOC); Dutch settlement at the Cape; slavery at the Cape; impact on indigenous peoples (Khoikhoi, San)',
      7: 'British colonialism in South Africa; the Great Trek and its causes; Anglo-Boer Wars; discovery of diamonds and gold; migrant labour; Bambatha Rebellion',
      8: 'apartheid laws and policies (Pass Laws, Group Areas Act, Bantu Education); the ANC and resistance (1912 founding, Defiance Campaign, Freedom Charter 1955); Sharpeville Massacre 1960; Steve Biko and Black Consciousness',
      9: 'SA transition to democracy: unbanning of the ANC (1990), negotiations (CODESA), democratic elections (27 April 1994), inauguration of Nelson Mandela; the Truth and Reconciliation Commission (TRC); SA Constitution (1996); post-apartheid challenges (inequality, unemployment, HIV/AIDS)',
    };

    const geographyTopics: Record<number, string> = {
      4: 'compass directions (N, S, E, W, NE, NW, SE, SW); map symbols and keys; SA provinces, capital cities and major rivers; climate and weather differences across SA',
      5: 'the globe (latitude, longitude, equator, tropics, poles); world continents and oceans; climate zones (tropical, temperate, polar); SA biomes (grassland, fynbos, savanna, Karoo, forest)',
      6: 'Africa — physical features (mountains, rivers, deserts); population distribution in Africa; climate regions of Africa; trade and resources in Africa; natural vs human-made features',
      7: 'map work: scale (calculating distance), contour lines (reading relief, gradient), grid references; climate graphs; SA climate regions; energy resources in SA (coal, solar, wind, hydro); renewable vs non-renewable energy',
      8: 'topographic map work (cross-sections, catchment areas); population geography (urbanisation, push and pull factors); settlement patterns; development indicators (GDP, HDI, literacy rate); developed vs developing countries; SA regions and economic activities',
      9: 'advanced map work (bearing, profile, gradient calculations); climate change — causes (greenhouse gases), effects on SA (droughts, floods, heat), response strategies; food security in SA; globalisation and its impact on SA; sustainable development goals (SDGs)',
    };

    const topicGuide = isHistory
      ? (historyTopics[grade] || historyTopics[9])
      : (geographyTopics[grade] || geographyTopics[9]);

    return `You are a South African Social Sciences (${subjectName}) tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key ${subjectName} concepts for Grade ${grade} SA CAPS.

Key topics to cover for Grade ${grade}:
  ${topicGuide}

For each card provide:
- term_en: the key concept, event, person, place, or term in English
- term_af: in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level explanation — include dates, causes, effects where relevant
- definition_af: the same in Afrikaans
- example_en: a specific South African example, fact, or application
- example_af: in Afrikaans
- category: "${category}"

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- All content must be factually accurate SA CAPS Grade ${grade} ${subjectName}
- Use specific names, dates, places and facts — not vague generalisations
- South African context throughout
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'ems') {
    const strandTopics: Record<string, string> = {
      economy: grade >= 7
        ? 'economic systems (traditional, command, market, mixed); the circular flow model (households, firms, government, foreign sector); factors of production (land, labour, capital, entrepreneurship); economic sectors (primary, secondary, tertiary, quaternary); unemployment and poverty in SA'
        : 'needs vs wants; goods vs services; economic activities (farming, mining, manufacturing, retail); the three sectors of the economy; scarcity and choice; opportunity cost',
      financial_literacy: grade >= 7
        ? 'types of bank accounts (cheque, savings, fixed deposit — features and uses); interest (simple vs compound, calculating interest); personal budget (income, fixed expenses, variable expenses, savings); financial documents: invoice, receipt, bank statement, budget; credit (advantages and dangers of debt)'
        : 'income and expenses; personal budget (planning income and expenses); saving (why save, where to save); banking basics (bank account, deposit, withdrawal); financial records (receipts and invoices)',
      entrepreneur: grade >= 7
        ? 'characteristics of successful entrepreneurs (risk-taking, creativity, perseverance, leadership); SWOT analysis (Strengths, Weaknesses, Opportunities, Threats); business plan components (executive summary, market analysis, financial plan); forms of business ownership (sole trader, partnership, close corporation, company); profit vs loss calculation'
        : 'who is an entrepreneur (characteristics and qualities); business ideas (how to identify opportunities); planning a small business; risks and rewards of running a business',
      business: grade >= 7
        ? 'consumer rights and responsibilities (Consumer Protection Act); advertising (types, target market, persuasion techniques); supply and demand (law of demand, law of supply, equilibrium price); government\'s role in the economy (taxation, spending, welfare); globalisation and international trade'
        : 'production process (raw materials → manufacturing → distribution → consumer); local and national economy; role of business in job creation; consumer rights (right to safety, information, choice); advertising and marketing',
    };

    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || Object.values(strandTopics).join(';\n  ')
      : Object.values(strandTopics).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : 'Spread cards across: economy, financial_literacy, entrepreneur, business';

    return `You are a South African Economic and Management Sciences (EMS) tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key EMS concepts for Grade ${grade} SA CAPS.

Key topics to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, term, or principle in English
- term_af: in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level explanation — include formulas or steps where applicable
- definition_af: the same in Afrikaans
- example_en: a practical South African business or financial example
- example_af: in Afrikaans
- category: one of [economy, financial_literacy, entrepreneur, business]

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- Use South African context (rands, SA banks, SA businesses, SA economic issues)
- Include calculations in examples for financial_literacy cards (show actual numbers)
- Grade ${grade} appropriate difficulty and language
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'technology') {
    const strandTopics: Record<string, string> = {
      design: 'the design process steps: Investigate (research the problem), Design (annotated sketches, choice of materials), Make (plan of action, tools, safety), Evaluate (test against criteria, suggest improvements), Communicate (present solution); design brief (problem statement, constraints, criteria); orthographic drawing basics; isometric drawing',
      structures: grade >= 7
        ? 'forces on structures: tension (pulling apart), compression (pushing together), torsion (twisting), shear (sliding past); how structures resist forces; triangulation for stability; properties of materials (strength, flexibility, hardness, density) and material selection; SA infrastructure examples'
        : 'natural and man-made structures; frame structures vs shell structures; what makes structures strong (triangular frames, base area, material choice); loads (static vs dynamic); bridge types (beam, arch, suspension)',
      mechanical: grade >= 7
        ? 'gear systems: driver gear, driven gear, gear ratio calculation, speed increase vs torque increase; cam and follower (rotary motion → reciprocating motion); belt-and-pulley systems; linkages (parallel, reverse motion); mechanical advantage; input-process-output model'
        : 'levers: fulcrum, load, effort; three classes of levers and examples (1st class: seesaw, 2nd class: wheelbarrow, 3rd class: tweezers); pulleys (fixed, movable, compound); gear wheels (driver and driven); wheel and axle; mechanical advantage',
      electrical: grade >= 7
        ? 'electronic components: resistor (colour code), capacitor, diode (direction of current), LED, transistor (as a switch); circuit symbols and reading circuit diagrams; logic gates: AND, OR, NOT — truth tables; printed circuit boards (PCB); input-process-output in electronic systems'
        : 'electric circuits: cell, battery, bulb, switch, wire — symbols and function; series circuit (one path — voltage splits, current same); parallel circuit (multiple paths — current splits, voltage same); measuring voltage (voltmeter) and current (ammeter); circuit faults (open circuit, short circuit)',
      processing: grade >= 7
        ? 'food processing techniques: drying/dehydration, canning (heat and seal), pasteurisation, fermentation, freezing — how each works and preserves food; material processing: casting (pouring liquid material into a mould), forging (shaping metal with heat and pressure), extrusion, spinning; textile production (natural vs synthetic fibres); SA manufacturing industries'
        : 'food processing (why we process food; methods: cooking, drying, pickling, freezing); separating and mixing materials; paper making process; recycling metals, plastics, paper, glass; responsible use of materials and sustainability',
    };

    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || Object.values(strandTopics).join(';\n  ')
      : Object.values(strandTopics).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : 'Spread cards across: design, structures, mechanical, electrical, processing';

    return `You are a South African Technology teacher creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key Technology concepts for Grade ${grade} SA CAPS.

Key topics to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, process, component, or principle in English
- term_af: in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level explanation — include how it works or a rule/formula where applicable
- definition_af: the same in Afrikaans
- example_en: a practical real-world example (preferably something a South African learner would recognise)
- example_af: in Afrikaans
- category: one of [design, structures, mechanical, electrical, processing]

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- Include diagrams descriptions in examples where helpful (e.g. "In a 1st-class lever like a seesaw...")
- Grade ${grade} appropriate difficulty and language
- South African context where possible
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'creative_arts') {
    const selectedStrand = strand && strand !== 'all' ? strand : 'visual_arts';

    const strandTopics: Record<string, string> = {
      visual_arts: grade >= 7
        ? 'elements of art (line, shape, colour, texture, space, value, form); principles of design (balance, contrast, emphasis, rhythm, unity, proportion, movement); colour theory (complementary, analogous, split-complementary schemes; tints/shades/tones); art history movements (Renaissance, Impressionism, Cubism, Abstract Expressionism); SA artists (Irma Stern, Gerard Sekoto, William Kentridge, Pierneef, Alexis Preller); printmaking techniques (relief, intaglio, screen print); composition principles (rule of thirds, golden ratio, focal point)'
        : 'elements of art: line, shape, colour (primary, secondary, tertiary), texture, space (positive/negative); colour theory: primary colours (red, blue, yellow), secondary colours (orange, green, purple), warm vs cool colours, complementary colours; SA traditional art: Ndebele geometric patterns and beadwork, San rock art (Drakensberg), Zulu beadwork, Sotho murals; basic techniques: sketching, shading, proportion; famous artists and their artworks',
      music: grade >= 7
        ? 'music notation: treble clef, note values (semibreve, minim, crotchet, quaver, semiquaver), time signatures (2/4, 3/4, 4/4, 6/8), key signatures, rests; music periods: Baroque (Bach, Handel — characteristics), Classical (Haydn, Mozart, Beethoven), Romantic (Chopin, Brahms); music forms: binary (AB), ternary (ABA), rondo, theme and variations; SA music: marabi, mbaqanga, kwaito, amapiano origins; SA legends: Hugh Masekela (flugelhorn, jazz activist), Miriam Makeba (click song, Pata Pata), Abdullah Ibrahim, Ladysmith Black Mambazo (isicathamiya); African music: call and response, polyrhythm, pentatonic scale'
        : 'elements of music: rhythm (beat, tempo), melody (pitch, scale), harmony (chords), dynamics (forte, piano, crescendo, diminuendo), timbre, texture; basic notation: treble clef, note names on the staff (EGBDF lines, FACE spaces), crotchet=1 beat, minim=2 beats, semibreve=4 beats; instrument families: strings (violin, viola, cello, double bass, guitar), woodwind (flute, clarinet, oboe, saxophone), brass (trumpet, trombone, French horn, tuba), percussion (drums, marimba, xylophone, piano); SA music: township gospel, kwaito (origins), maskandi; voice types: soprano, alto, tenor, bass',
      drama: grade >= 7
        ? 'dramatic genres: tragedy (hamartia, catharsis), comedy (types: comedy of manners, slapstick, satire), farce, melodrama, absurdism, physical theatre; dramatic conventions: soliloquy, monologue, aside, dramatic irony, flashback, freeze frame, narrator; staging elements: blocking, proxemics (use of space), stage areas (upstage/downstage, stage left/right/centre), staging configurations (proscenium, thrust, in-the-round, traverse); SA theatre history: Athol Fugard (Sizwe Banzi is Dead, Master Harold), Mbongeni Ngema (Sarafina!), Barney Simon; Brechtian Epic Theatre (Verfremdungseffekt, didactic theatre); devised and community theatre'
        : 'elements of drama: character (protagonist, antagonist), plot structure (exposition, rising action, climax, falling action, resolution — Freytag\'s pyramid), setting, conflict (person vs person, self, nature, society), theme; drama techniques: mime, improvisation, role play, freeze frame, hot seating, thought tracking, still image; playwright terminology: stage directions, dialogue, monologue, scene, act; SA performance traditions: praise poetry (izibongo/direto), storytelling, community theatre, street theatre; performance skills: body language, facial expression, vocal projection, pace, pause, pitch',
      dance: grade >= 7
        ? 'elements of dance: body (actions — locomotor: walk/run/jump/hop/skip/gallop/slide/leap; non-locomotor: bend/stretch/twist/swing/sway), space (level/direction/pathway/size/shape), time (beat/rhythm/tempo/duration/accent), energy (force: strong/gentle; flow: free/bound; weight: heavy/light), relationships (unison, canon, mirroring, question and answer, contrast, complement); dance styles: African (polyrhythm, grounded, improvisation, community function), contemporary/modern (Graham, Limón, release technique), jazz (syncopation, isolations, high kicks), hip-hop (breaking, locking, popping, krump), ballet (barre work, positions 1-5 of feet and arms); SA dances: Zulu indlamu (powerful stamping, warrior tradition), isicathamiya (Zulu men\'s choral), Sotho moribelo, Venda tshigombela; choreographic devices: motif and development, repetition, retrograde, inversion, augmentation, canon'
        : 'elements of dance: body (what body parts move and how), space (levels: low/middle/high; directions: forward/backward/sideways/diagonal; pathways: straight/curved/zigzag; personal and general space), time (beat, rhythm, tempo: fast/slow, sudden/sustained), energy (how movement feels: sharp/smooth, heavy/light, strong/gentle); SA traditional dances: Zulu indlamu (warrior stamping dance), Xhosa traditional dances and ululation, Sotho moribelo, Venda tshigombela, Cape Malay ghoema traditions; dance health and safety: warming up (mobilisation, stretching), cooling down, common dance injuries and prevention, nutrition and hydration; basic dance steps: gallop, skip, chassé, step-touch, grapevine, pivot turn; dance vocabulary: choreographer, performer, audience, improvisation',
    };

    const topicGuide = strandTopics[selectedStrand] || strandTopics.visual_arts;
    const strandLabels: Record<string, string> = {
      visual_arts: 'Visual Arts', music: 'Music', drama: 'Drama', dance: 'Dance',
    };
    const strandLabel = strandLabels[selectedStrand] || 'Visual Arts';

    return `You are a South African Creative Arts (${strandLabel}) tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key ${strandLabel} theory for Grade ${grade} SA CAPS Creative Arts.

Key topics to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, technique, term, artist, or element in English
- term_af: in Afrikaans
- definition_en: a clear, accurate Grade ${grade}-level explanation — what it is, how it works, or what makes it significant
- definition_af: the same in Afrikaans
- example_en: a specific South African example, artwork, performance, or real-world application
- example_af: in Afrikaans
- category: "${selectedStrand}"

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- Prioritise South African artists, musicians, performers, and cultural examples
- Mix theory/terminology cards with artist/cultural knowledge cards
- Definitions must be accurate and Grade ${grade} appropriate
- Do NOT include any text outside the JSON array`;
  }

  if (subjectCode === 'egd') {
    const isFET = grade >= 10;
    const strandTopics: Record<string, string> = {
      technical_drawing: isFET
        ? grade >= 11
          ? 'auxiliary views: primary auxiliary (true shape of inclined surfaces), secondary auxiliary; true length of oblique lines; traces of lines; two-point perspective by measuring point method; advanced orthographic with inclined and oblique surfaces'
          : 'orthographic projection: 1st angle (European) vs 3rd angle (American) — symbol, layout and key differences; drawing all three views of objects with inclined surfaces; isometric drawing (isometric ellipses for circles, hatching, dimensioning); oblique projection: cavalier (1:1 depth) vs cabinet (1:2 depth), receding angle 30° or 45°; one-point and two-point perspective'
        : 'types of drawing lines: continuous thick (outline), continuous thin (dimension/projection/hatching), dashed thin (hidden detail), chain thin (centre line), chain thick (cutting plane); drawing instruments: compass, 45° set square, 30°/60° set square, protractor, T-square, scale rule; SA drawing standards (SANS 10111); drawing paper sizes A0–A4; title block contents; scales: enlargement (2:1), full size (1:1), reduction (1:2, 1:10); 1st angle orthographic projection of simple prisms; isometric drawing on isometric grid',
      geometric_drawing: isFET
        ? grade >= 11
          ? 'conic sections: ellipse (concentric circle, parallelogram, trammel and trammel-in-rectangle methods), parabola (rectangle and tangent-from-vertex methods), hyperbola (rectangle method); loci: equidistant from a point (circle), from a line (parallel), from two points (perpendicular bisector), locus of a point on a rolling circle (cycloid); involute of a circle; tangency between two arcs and a straight line'
          : 'regular polygon construction: equilateral triangle, square, regular pentagon (accurate method), regular hexagon (using compass), regular octagon (from given square); inscribed circle and circumscribed circle; ellipse by concentric circle method (locating foci, drawing); tangent to a circle at a point on it; tangent from an external point to a circle; common external tangent to two equal and unequal circles'
        : 'geometric constructions: bisect a line segment (perpendicular bisector), bisect an angle, erect a perpendicular at a point on a line, drop a perpendicular from a point to a line; inscribed hexagon and square in a circle; tangent to a circle at a point on the circumference; arc tangent joining two straight lines (internal and external corner radius); constructing an equilateral triangle; dividing a line into equal parts',
      solid_geometry: isFET
        ? grade >= 11
          ? 'interpenetration of solids: two cylinders of equal diameter at right angles (curve of intersection), cylinder penetrating a rectangular prism, two rectangular prisms; development of interpenetrating solids; truncated cylinder (oblique cut) — development and true shape; truncated cone (oblique cut) — development; frustum of oblique pyramid — development; true shape of cut surfaces through various solids'
          : 'development (surface unfolding) of right prisms: square, rectangular, triangular, hexagonal prisms; development of right cylinder; development of right pyramid: square, rectangular, triangular base; development of right cone; frustum of cone; frustum of pyramid; true shape of cut surface (section) through a prism and cylinder using auxiliary plane'
        : '3D solids: prisms (triangular, rectangular, square, hexagonal), cylinders, cones, pyramids — naming faces, edges, vertices; Euler\'s formula F + V − E = 2; sectional views: what they show, hatching conventions (angle 45°, spacing, opposite parts), material-specific hatching symbols; development of a right square prism (box) — concept; understanding how a 3D solid maps to orthographic views',
      mechanical_drawing: isFET
        ? 'thread conventions: external thread (ISO V-thread — major diameter shown as thick lines, minor diameter as thin lines, helix = thin slanting lines); internal thread (in section — minor diameter thick, major diameter thin); stud (B.S.W. proportions from d); hexagonal bolt and nut — drawing in three views using proportional dimensions (from bolt diameter d); keys: Woodruff key, feather key, Gib-head key — drawing and purpose; bearing representations (plain journal bearing, ball bearing in section); reading assembly drawings — identifying parts, understanding section conventions, reading a bill of materials (BOM); ISO tolerance system: clearance fit, interference fit, transition fit — definitions and examples'
        : 'conventional thread representation: external thread (continuous thick lines for crest, continuous thin for root, thin slanting lines for helix); thread terminology: major diameter, minor diameter, pitch, lead, thread angle; standard thread designations (M10 × 1.5 means M = metric, 10 = major diameter, 1.5 = pitch); bolts and nuts: proportional dimensions from bolt diameter d; identifying parts in a simple assembly drawing; fastener types: bolts, studs, screws, set screws; welding symbols: fillet weld, butt weld — basic identification',
      civil_drawing: isFET
        ? 'complete set of building drawings: site plan (plot boundary, north point, setbacks, building outline, scale 1:200 or 1:500), floor plan (wall thickness 230 mm cavity or 110 mm single, door symbols with swing, window symbols — fixed/sliding/casement, room labels, dimensions, scale 1:100), front and side elevations (roof pitch, window and door heights, DPC line, floor levels), cross-section through a building (foundation, wall construction, roof structure, overhangs), roof plan (identifying roof types — gabled, hipped, flat, lean-to); building regulations: 3 m side setback, 5 m street setback, 60% coverage maximum; reading contour lines on a site plan'
        : 'reading a floor plan: rooms (bedroom, kitchen, bathroom, lounge), walls (thick lines = walls), doors (quarter-circle arc shows direction of opening), windows (three parallel lines), scale (1:100 means 1 cm on drawing = 100 cm = 1 m in reality); SA building drawing conventions: symbols for light switch, power outlet, ceiling light, toilet, bath, basin; elevation: shows the outside face of a building — front elevation (most important facade), side elevation, rear elevation; scale calculations: if scale is 1:50 and drawing shows 4 cm, actual length = 4 × 50 = 200 cm = 2 m; north point on site plan; understanding site plan vs floor plan vs elevation',
    };

    const availableStrands = isFET
      ? ['technical_drawing', 'geometric_drawing', 'solid_geometry', 'mechanical_drawing', 'civil_drawing']
      : ['technical_drawing', 'geometric_drawing', 'solid_geometry', 'civil_drawing'];
    const selectedStrand = strand && strand !== 'all' ? strand : null;
    const topicGuide = selectedStrand
      ? strandTopics[selectedStrand] || availableStrands.map(s => strandTopics[s]).join(';\n  ')
      : availableStrands.map(s => strandTopics[s]).join(';\n  ');
    const categoryInstruction = selectedStrand
      ? `All cards must have category: "${selectedStrand}"`
      : `Spread cards across: ${availableStrands.join(', ')}`;

    return `You are a South African Engineering Graphics and Design (EGD) tutor creating concept revision cards for Grade ${grade} learners.

Generate exactly 10 concept cards covering key EGD theory and knowledge for Grade ${grade} SA CAPS.

Key topics to cover:
  ${topicGuide}

For each card provide:
- term_en: the key concept, term, drawing standard, or convention in English
- term_af: in Afrikaans (use correct SA EGD/drawing terminology)
- definition_en: a clear, accurate Grade ${grade}-level explanation — include the rule, standard, or how it works
- definition_af: the same in Afrikaans
- example_en: a practical drawing or design example (how it looks, when it's used, what it means)
- example_af: in Afrikaans
- category: one of [${availableStrands.join(', ')}]

Return ONLY a valid JSON array with the structure above.

IMPORTANT:
- EGD terminology must be technically accurate (SANS/ISO drawing standards, CAPS EGD curriculum)
- Explain visual concepts clearly in words (e.g. "An isometric circle is drawn as an ellipse with its major axis perpendicular to the isometric axis")
- Grade ${grade} appropriate difficulty and terminology
- ${categoryInstruction}
- Do NOT include any text outside the JSON array`;
  }

  throw new AppError(`Tutoring not yet available for ${subjectCode}`, 400);
}

export default router;
