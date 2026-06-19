import { CreateLoggy, CreateMetrics, CreateTracer } from "@loggydev/loggy-node";

const LOGGY_TOKEN = "f46802a4-9bf6-42f5-ab06-93932eab641f";
const LOGGY_BASE_URL = "http://localhost:3000/api";

export const loggy = CreateLoggy({
  identifier: "disco",
  remote: {
    endpoint: `${LOGGY_BASE_URL}/logs/ingest`,
    token: LOGGY_TOKEN,
  },
});

export const metrics = CreateMetrics({
  token: LOGGY_TOKEN,
  endpoint: `${LOGGY_BASE_URL}/metrics/ingest`,
});

const randomSentences = [
  "The quick brown fox jumps over the lazy dog",
  "A wizard's job is to vex chumps quickly in fog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Sphinx of black quartz, judge my vow",
  "Two driven jocks help fax my big quiz",
  "The jay, pig, fox, zebra and my wolves quack",
  "Sympathizing would fix Quaker objectives",
  "A quivering Texas zombie fought republic linked jewelry",
];

const getRandomSentence = () =>
  randomSentences[Math.floor(Math.random() * randomSentences.length)];

export const testLoggyWarn = () => {
  const sentence = getRandomSentence();
  loggy.warn(sentence, {
    test: true,
    type: "warning_test",
    timestamp: Date.now(),
    randomId: Math.random().toString(36).substring(7),
  });
};

export const testLoggyError = () => {
  const sentence = getRandomSentence();
  loggy.error(sentence, {
    test: true,
    type: "error_test",
    timestamp: Date.now(),
    randomId: Math.random().toString(36).substring(7),
  });
};

// Frontend service tracer - for SSR pages
export const frontendTracer = CreateTracer({
  serviceName: "disco-frontend",
  serviceVersion: "1.0.0",
  remote: {
    token: LOGGY_TOKEN,
    endpoint: `${LOGGY_BASE_URL}/traces/ingest`,
  },
});

// API service tracer - for API routes
export const apiTracer = CreateTracer({
  serviceName: "disco-api",
  serviceVersion: "1.0.0",
  remote: {
    token: LOGGY_TOKEN,
    endpoint: `${LOGGY_BASE_URL}/traces/ingest`,
  },
});

// Discogs client service tracer - for external API calls
export const discogsTracer = CreateTracer({
  serviceName: "discogs-client",
  serviceVersion: "1.0.0",
  remote: {
    token: LOGGY_TOKEN,
    endpoint: `${LOGGY_BASE_URL}/traces/ingest`,
  },
});

// Legacy alias for backward compatibility
export const tracer = apiTracer;
