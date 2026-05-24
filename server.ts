import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LUNG_CANCER_DB, NUTRITION_DB } from './services/knowledgeBase';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing!");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(express.json());
app.use(cookieParser());

// --- RAG Implementation ---

interface Document {
  id: string;
  text: string;
  metadata: any;
  embedding?: number[];
}

class VectorStore {
  documents: Document[] = [];

  async addDocuments(docs: Document[]) {
    console.log(`Embedding ${docs.length} documents...`);
    for (const doc of docs) {
       try {
         // Use text-embedding-004 for embeddings
         const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
         const embeddingResult = await model.embedContent(doc.text);
         doc.embedding = embeddingResult.embedding.values;
         this.documents.push(doc);
       } catch (e) {
         console.error("Error embedding doc:", doc.id, e);
       }
    }
    console.log("Embedding complete.");
  }

  async search(query: string, topK: number = 3): Promise<Document[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await model.embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;

        const scoredDocs = this.documents.map(doc => ({
        doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding!)
        }));

        scoredDocs.sort((a, b) => b.score - a.score);
        return scoredDocs.slice(0, topK).map(d => d.doc);
    } catch (e) {
        console.error("Error searching vector store:", e);
        return [];
    }
  }

  cosineSimilarity(a: number[], b: number[]) {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    // Avoid division by zero
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

const vectorStore = new VectorStore();

async function initRAG() {
  console.log("Initializing RAG Knowledge Base...");
  const docs: Document[] = [];
  
  // Process LUNG_CANCER_DB
  LUNG_CANCER_DB.forEach(cat => {
    cat.adverseEvents.forEach(ae => {
      const text = `Side Effect: ${ae.name}. Mechanism: ${ae.mechanism || ''}. Management: ${ae.management.actionableSteps.join(', ')}. Medications: ${ae.management.medications?.join(', ') || ''}. When to seek help: ${ae.management.whenToSeekHelp || ''}. Comfort: ${ae.comfortMessage || ''}`;
      docs.push({
        id: `ae-${ae.id}`,
        text,
        metadata: { type: 'SideEffect', category: cat.name, name: ae.name }
      });
    });
  });

  // Process NUTRITION_DB
  NUTRITION_DB.forEach(nut => {
    const text = `Nutrition for ${nut.condition}: ${nut.content}. Allowed foods: ${nut.allowedFoods.join(', ')}. Avoid foods: ${nut.avoidFoods.join(', ')}.`;
    docs.push({
      id: `nut-${nut.id}`,
      text,
      metadata: { type: 'Nutrition', condition: nut.condition }
    });
  });

  await vectorStore.addDocuments(docs);
  console.log(`RAG Initialized with ${vectorStore.documents.length} documents.`);
}

// Initialize RAG in background
initRAG();

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
  const { id, password } = req.body;

  // Mock User DB (In real app, fetch from DB)
  // Patient: 000 / 000
  // Doctor: 111 / 111
  
  let role = '';
  let name = '';
  let valid = false;

  if (id === '000' && password === '000') {
      role = 'DOCTOR';
      name = '李医生';
      valid = true;
  } else if (['888', '555', '333', '222', '111'].includes(id) && password === id) {
      role = 'PATIENT';
      name = '测试患者';
      valid = true;
  }

  if (valid) {
    const token = jwt.sign({ id, role, name }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ success: true, user: { id, role, name } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// --- RAG Endpoint ---

app.post('/api/knowledge/query', async (req, res) => {
  const { query, context } = req.body;
  
  try {
    // 1. Retrieve relevant docs
    const relevantDocs = await vectorStore.search(query);
    const contextText = relevantDocs.map(d => d.text).join('\n\n');

    console.log(`Query: ${query}`);
    console.log(`Retrieved ${relevantDocs.length} docs`);

    // 2. Generate Answer
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-latest" });
    const prompt = `
      You are an expert oncologist assistant. Use the following medical knowledge to answer the patient's question.
      
      Medical Knowledge Context:
      ${contextText}

      Patient Context:
      ${JSON.stringify(context)}

      Patient Question: ${query}

      Answer (be empathetic, professional, and concise, in Chinese):
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    res.json({ answer: responseText, sources: relevantDocs.map(d => d.metadata) });
  } catch (error) {
    console.error('RAG Error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// --- Vite Middleware ---

async function startServer() {
  // Note: We need to attach Vite middleware *after* API routes.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// We need to move the app.use calls into a function or ensure they run before startServer's vite middleware
// The current structure has app.use(json) and routes defined globally.
// This is fine as long as startServer attaches vite middleware *last*.
// But wait, the previous code had `startServer` creating a *new* app instance?
// No, it was `const app = express()` at top level.
// Ah, the previous `server.ts` had `async function startServer() { const app = express(); ... }`.
// My new code has `const app = express()` at top level.
// I should move the route definitions inside `startServer` or keep `app` global and just attach vite in `startServer`.
// I'll keep `app` global but move the listen call to `startServer`.
// And I need to make sure `app.use(vite.middlewares)` is called *after* API routes.
// Since API routes are defined *before* `startServer()` is called, and `startServer` attaches vite middleware, it should be fine?
// Express middleware order: request comes in -> matches API routes? -> if not, goes to next middleware (Vite).
// Yes, that works.

startServer();
