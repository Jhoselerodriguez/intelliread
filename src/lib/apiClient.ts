import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, ChatMessage, APIKeys } from "@/types";

interface AIResponse {
  content: string;
  citations?: { page: number; text: string }[];
}

const INTELLIAI_SYSTEM_PROMPT = `You are intelliAi, an intelligent PDF analysis assistant built into intelliRead platform. You help users understand and extract information from their PDF documents through natural conversation.

Key traits:
- You are intelliAi (not ChatGPT, Claude, or any other AI)
- You specialize in PDF document analysis and information extraction
- You provide accurate, cited answers based strictly on the document content
- You are concise, professional, and helpful
- When users ask who you are, introduce yourself as "intelliAi, your PDF intelligence assistant"
- Do not use markdown formatting like asterisks for bold or italic text

Always cite your sources with page numbers when referencing document content.`;

// Clean AI response to remove markdown formatting
const cleanAIResponse = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^\* /gm, "• ")
    .replace(/^- /gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// Initialize Gemini
const initGemini = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey);
};

// Correct Gemini model name
const GEMINI_MODEL = "gemini-2.5-flash-lite";
// Test Gemini Connection
export const testGeminiConnection = async (
  apiKey: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent("Hello, test connection.");
    const response = await result.response;
    const text = response.text();

    if (text) {
      return { success: true };
    }
    return { success: false, error: "No response received" };
  } catch (error: any) {
    return { success: false, error: error.message || "Connection failed" };
  }
};

// Generate Image Description with Gemini
export const generateImageDescription = async (
  imageBlob: Blob,
  apiKey: string
): Promise<string> => {
  try {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Convert blob to base64
    const base64 = await blobToBase64(imageBlob);
    const base64Data = base64.split(",")[1];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageBlob.type || "image/png",
      },
    };

    const prompt =
      "Describe this image in detail. Focus on what it shows, any text visible, and its purpose in the document.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini image description error:", error);
    return "Image from document";
  }
};

// Detect if image is a chart using Gemini
export const detectIfChart = async (
  imageBlob: Blob,
  apiKey: string
): Promise<boolean> => {
  try {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const base64 = await blobToBase64(imageBlob);
    const base64Data = base64.split(",")[1];

    const result = await model.generateContent([
      "Is this image a chart, graph, or data visualization? Answer only YES or NO.",
      {
        inlineData: {
          data: base64Data,
          mimeType: imageBlob.type || "image/png",
        },
      },
    ]);

    const text = result.response.text().toLowerCase();
    return text.includes("yes");
  } catch {
    return false;
  }
};

// Extract Chart Data with Gemini
export const extractChartData = async (
  chartBlob: Blob,
  apiKey: string
): Promise<{ description: string; data: any }> => {
  try {
    const genAI = initGemini(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const base64 = await blobToBase64(chartBlob);
    const base64Data = base64.split(",")[1];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: chartBlob.type || "image/png",
      },
    };

    const prompt = `Analyze this chart/graph and provide:
1. A brief description of what the chart shows
2. Extract all data points in JSON format with labels and values
3. Identify chart type (bar, line, pie, etc.)

Return ONLY a JSON object with this structure:
{
  "type": "chart_type",
  "description": "what the chart shows",
  "data": [{"label": "...", "value": ...}, ...]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || text,
        data: parsed.data || null,
      };
    }

    return { description: text, data: null };
  } catch (error) {
    console.error("Gemini chart extraction error:", error);
    return { description: "Chart from document", data: null };
  }
};

// Analyze selected text with Groq
export const analyzeSelectedText = async (
  text: string,
  apiKey: string
): Promise<string> => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are intelliAi. Analyze the selected text from a PDF document and provide: 1) A brief summary, 2) Key concepts, 3) Context within the document. Be concise and do not use markdown formatting.",
            },
            {
              role: "user",
              content: `Analyze this text from the document:\n\n"${text}"`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Analysis failed");
    }

    const data = await response.json();
    return cleanAIResponse(data.choices[0].message.content);
  } catch (error) {
    console.error("Analysis error:", error);
    return "Sorry, I couldn't analyze this text. Please try again.";
  }
};

// Helper function
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const testAPIConnection = async (
  provider: AIProvider | "gemini",
  apiKey: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (provider === "groq") {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 5,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }
      return { success: true };
    }

    if (provider === "perplexity") {
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 5,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }
      return { success: true };
    }

    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }
      return { success: true };
    }

    if (provider === "gemini") {
      return testGeminiConnection(apiKey);
    }

    throw new Error("Unknown provider");
  } catch (error: any) {
    return { success: false, error: error.message || "Connection failed" };
  }
};

export const callAI = async (
  provider: AIProvider,
  apiKey: string,
  messages: ChatMessage[],
  context: string
): Promise<AIResponse> => {
  const systemPrompt = `${INTELLIAI_SYSTEM_PROMPT}

DOCUMENT CONTEXT:
${context}

Instructions:
- Answer based on the document context provided
- If the answer isn't in the context, say so
- Be concise but thorough
- Reference specific sections when applicable
- Do not use markdown formatting`;

  try {
    if (provider === "groq") {
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: formattedMessages,
            max_tokens: 2048,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { content: cleanAIResponse(data.choices[0].message.content) };
    }

    if (provider === "perplexity") {
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: formattedMessages,
            max_tokens: 2048,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { content: cleanAIResponse(data.choices[0].message.content) };
    }

    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { content: cleanAIResponse(data.content[0].text) };
    }

    throw new Error("Unknown provider");
  } catch (error: any) {
    throw new Error(`AI request failed: ${error.message}`);
  }
};

export const getAvailableProviders = (
  apiKeys: APIKeys | undefined
): AIProvider[] => {
  const providers: AIProvider[] = [];
  if (apiKeys?.groqApiKey) providers.push("groq");
  if (apiKeys?.perplexityApiKey) providers.push("perplexity");
  if (apiKeys?.anthropicApiKey) providers.push("anthropic");
  return providers;
};
