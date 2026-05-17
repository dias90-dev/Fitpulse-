import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Virtual Trainer API
  app.post('/api/trainer/generate', async (req, res) => {
    const { profile, userRequest, workoutFocus, extraEquipment } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Health profile required' });
    }

    const prompt = `
      Você é o "FitPulse Master Trainer", uma inteligência artificial de elite especializada em fisiologia do exercício e treinamento personalizado.
      
      ## Perfil Biométrico do Atleta
      - Idade: ${profile.age} anos | Gênero: ${profile.gender}
      - Composição: ${profile.weight}kg, ${profile.height}cm
      - Condições Médicas/Lesões: ${profile.injuries || 'Nenhuma restrição relatada'}
      - Objetivos Principais: ${profile.goals}
      - Infraestrutura Disponível: ${profile.equipment || 'Somente objetos domésticos'}
      - Equipamento EXTRA informado: ${extraEquipment || 'Nenhum'}
      
      ## Foco do Treino Atual
      🔥 FOCO: ${workoutFocus || 'Geral'}
      
      ## Solicitação Específica
      "${userRequest || 'Criar protocolo de treinamento otimizado para o perfil.'}"
      
      ## Suas Diretrizes Estritas:
      1. SEGURANÇA: Se houver lesões, adapte os exercícios para ZERO impacto ou tensão na área afetada.
      2. EQUIPAMENTO: Combine o equipamento oficial do perfil com o "equipamento extra" informado. Se for limitado a "objetos domésticos", seja criativo mas prático (ex: galão de 5L, cadeira, mochila).
      3. METODOLOGIA: O foco "${workoutFocus}" deve ditar as variáveis:
         - força: cargas altas, poucas reps (4-6), descanso longo.
         - hipertrofia: reps moderadas (8-12), tempo sob tensão alto.
         - resistência: muitas reps (15+), descanso curto.
         - flexibilidade: foco em alongamento dinâmico e estático.
         - emagrecimento: circuitos, alta densidade, pouco descanso.
      4. ESTRUTURA: Retorne de 5 a 8 exercícios técnicos.
      
      ## Formato de Resposta (JSON):
      {
        "title": "Nome impactante do treino",
        "description": "Explicação técnica de por que este treino foi escolhido para o biotipo do usuário",
        "exercises": [
          {
            "name": "Nome do exercício",
            "sets": "Número de séries",
            "reps": "Repetições ou tempo",
            "instruction": "Dica técnica de execução e respiração",
            "equipment": "O que usar exatamente (se doméstico, especifique o objeto)"
          }
        ],
        "safetyNote": "Aviso crucial sobre a lesão ou postura",
        "motivation": "Frase de encorajamento baseada no objetivo solicitado"
      }
      
      Responda EXCLUSIVAMENTE em PORTUGUÊS brasileiro.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.STRING },
                    reps: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    equipment: { type: Type.STRING }
                  },
                  required: ['name', 'sets', 'reps', 'instruction']
                }
              },
              safetyNote: { type: Type.STRING },
              motivation: { type: Type.STRING }
            },
            required: ['title', 'description', 'exercises', 'safetyNote', 'motivation']
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: 'Erro ao gerar treino virtual.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
