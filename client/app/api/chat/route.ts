import { NextRequest } from "next/server";
import OpenAI from "openai";

const apiKeys = [
  process.env.A4F_API_KEY,
  process.env.A4F_API_KEY2,
].filter(Boolean);

const clients = apiKeys.map(
  (key) =>
    new OpenAI({
      apiKey: key,
      baseURL: "https://api.a4f.co/v1",
    })
);

let clientIndex = 0;

function getClient() {
  return clients[clientIndex];
}

function rotateClient() {
  clientIndex = (clientIndex + 1) % clients.length;
  console.warn(`Switched to fallback client index: ${clientIndex}`);
}

// --- Helpers ---
async function getWeather(location: string) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}`
  );
  const geoData = await geoRes.json();
  const place = geoData.results?.[0];
  if (!place) return null;

  const { latitude, longitude, name } = place;
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
  );
  const weatherData = await weatherRes.json();
  return {
    location: name,
    temperature: weatherData.current_weather?.temperature + "°C",
    condition: weatherData.current_weather?.weathercode || "Unknown",
  };
}

async function searchGutenbergBooks(search_terms: string) {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(search_terms)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results?.map((book: any) => ({
    id: book.id,
    title: book.title,
    authors: book.authors.map((a: any) => a.name),
  }));
}

// --- Core streaming with N fallbacks ---
async function streamWithFallback(params: any, retriesLeft = clients.length - 1): Promise<ReadableStream> {
  let client = getClient();

  return new ReadableStream({
    async start(controller) {
      while (true) {
        try {
          const response = await client.chat.completions.stream(params);

          for await (const event of response as any) {
            const content = event.choices?.[0]?.delta?.content;
            if (!content) continue;

            // Parse for tool call
            let toolParsed;
            try { toolParsed = JSON.parse(content); } catch { toolParsed = null; }

            if (toolParsed?.type?.startsWith("tool_")) {
              switch (toolParsed.type) {
                case "tool_get_weather": {
                  const weather = await getWeather(toolParsed.location);
                  controller.enqueue(
                    new TextEncoder().encode(JSON.stringify({ parts: [{ type: "tool_get_weather", data: weather }] }) + "\n")
                  );
                  break;
                }
                case "tool_search_books": {
                  const books = await searchGutenbergBooks(toolParsed.search_terms);
                  controller.enqueue(
                    new TextEncoder().encode(JSON.stringify({ parts: [{ type: "tool_search_books", data: books }] }) + "\n")
                  );
                  break;
                }
              }
              continue;
            }

            // Normal text
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify({ parts: [{ type: "text", text: content }] }) + "\n")
            );
          }

          break; // successfully finished streaming
        } catch (err: any) {
          // Rotate client if rate limit hit and retries remain
          if (err.status === 429 && retriesLeft > 0) {
            console.warn("Hit 429 mid-stream, switching client...");
            rotateClient();
            client = getClient();
            retriesLeft--;
            continue; // retry whole stream with new client
          }
          controller.error(err);
          break;
        }
      }
      controller.close();
    },
  });
}

// --- API Handler ---
export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
    }

    const systemMessage = {
      role: "system",
      content: `
You have access to the following tools:
1. Weather tool:
{"type": "tool_get_weather", "location": "<city name>"}
2. Gutenberg search:
{"type": "tool_search_books", "search_terms": "<keywords>"}

If a user asks a question that requires a tool, respond ONLY with a valid JSON object.
Otherwise, respond with normal text.
      `,
    };

    const stream = await streamWithFallback({
      model: model || "provider-6/gemini-2.5-flash-thinking",
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("Streaming failed:", err);
    return new Response(JSON.stringify({ error: "Failed to start stream" }), { status: 500 });
  }
}
