import { NextRequest, NextResponse } from "next/server";

interface GenerateImageRequest {
  prompt: string;
  brokerPhotos?: string[];
  systemPrompt?: string;
  style?: string;
}

interface GenerateImageResponse {
  imageData?: string;
  mimeType?: string;
  error?: string;
  mock?: boolean;
}

function stripDataUriPrefix(dataUri: string): string {
  const base64Index = dataUri.indexOf("base64,");
  return base64Index !== -1 ? dataUri.slice(base64Index + 7) : dataUri;
}

function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);/);
  return match ? match[1] : "image/jpeg";
}

const IMAGE_STYLE_SYSTEM = `Você é um gerador de imagens para posts de Instagram de imóveis de alto padrão.
Crie imagens profissionais, premium e visualmente impactantes.
Estilo: fotografia arquitetônica de luxo, iluminação dramática, composição elegante.
Formato: quadrado (1:1) ou retrato (4:5) adequado para Instagram.
Paleta: tons escuros com detalhes em dourado/âmbar, clean e sofisticado.
Texto na imagem: mínimo, apenas se explicitamente solicitado.`;

function getGeminiErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: {
        message?: string;
        status?: string;
        details?: Array<{ reason?: string }>;
      };
    };
    const reason = parsed.error?.details?.find((detail) => detail.reason)?.reason;

    if (status === 400 && (parsed.error?.status === "INVALID_ARGUMENT" || reason === "API_KEY_INVALID" || parsed.error?.message?.includes("API key"))) {
      return "Chave GOOGLE_AI_API_KEY inválida. Gere uma chave válida no Google AI Studio e reinicie o servidor.";
    }

    if (status === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED") {
      return "Limite de cota diária ou por minuto excedido no Google AI Studio (Free Tier) para geração de imagem. Tente novamente em instantes.";
    }

    return parsed.error?.message ?? `Erro na API do Gemini (${status})`;
  } catch {
    return `Erro na API do Gemini (${status}): ${body}`;
  }
}

async function generateWithImagen(apiKey: string, prompt: string, modelName: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        outputOptions: { mimeType: "image/jpeg" },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(getGeminiErrorMessage(response.status, errText));
  }

  const data = await response.json();
  const bytes = data?.predictions?.[0]?.bytesBase64Encoded;
  const mimeType = data?.predictions?.[0]?.mimeType ?? "image/jpeg";

  if (!bytes) {
    throw new Error("Nenhuma imagem gerada pelo Imagen 3");
  }

  return { imageData: bytes, mimeType };
}

async function generateWithGeminiMultimodal(apiKey: string, prompt: string, brokerPhotos: string[], systemPrompt: string, modelName: string) {
  const combinedSystem = [IMAGE_STYLE_SYSTEM, systemPrompt].filter(Boolean).join("\n\n");
  const parts: object[] = [];

  for (const photo of brokerPhotos) {
    if (!photo) continue;
    parts.push({
      inlineData: {
        mimeType: getMimeType(photo),
        data: stripDataUriPrefix(photo),
      },
    });
  }

  parts.push({ text: prompt });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const requestBody = {
    system_instruction: { parts: [{ text: combinedSystem }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 0.9,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(getGeminiErrorMessage(response.status, errText));
  }

  const data = await response.json();
  const resParts = data?.candidates?.[0]?.content?.parts ?? [];

  for (const part of resParts) {
    if (part.inlineData?.data) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }

  throw new Error("Nenhuma imagem retornada no conteúdo gerado.");
}

export async function POST(req: NextRequest): Promise<NextResponse<GenerateImageResponse>> {
  const body: GenerateImageRequest = await req.json();
  const { prompt, brokerPhotos = [], systemPrompt = "" } = body;

  const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    return NextResponse.json({ mock: true, error: "GOOGLE_AI_API_KEY não configurada no .env.local" });
  }

  const configuredModel = process.env.GEMINI_IMAGE_MODEL?.trim() || "imagen-3.0-generate-002";

  try {
    if (configuredModel.includes("imagen")) {
      try {
        const result = await generateWithImagen(apiKey, prompt, configuredModel);
        return NextResponse.json(result);
      } catch (err) {
        console.warn("Imagen 3 API fallback to Gemini Multimodal:", err);
        const result = await generateWithGeminiMultimodal(apiKey, prompt, brokerPhotos, systemPrompt, "gemini-2.0-flash");
        return NextResponse.json(result);
      }
    } else {
      try {
        const result = await generateWithGeminiMultimodal(apiKey, prompt, brokerPhotos, systemPrompt, configuredModel);
        return NextResponse.json(result);
      } catch (err) {
        console.warn("Gemini Multimodal fallback to Imagen 3:", err);
        const result = await generateWithImagen(apiKey, prompt, "imagen-3.0-generate-002");
        return NextResponse.json(result);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao gerar imagem";
    return NextResponse.json({ error: message, mock: true });
  }
}
