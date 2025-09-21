// import { NextRequest, NextResponse } from "next/server";

// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// const A4F_API_KEY =  process.env.A4F_API_KEY;
// const A4F_BASE_URL = "https://api.a4f.co/v1";

// export async function POST(req: NextRequest) {
//   try {
//     const { messages, model } = await req.json();

//     if (!messages || !messages.length) {
//       return NextResponse.json({ error: "No messages provided" }, { status: 400 });
//     }

//     // Payload for OpenRouter streaming
//     const payload = {
//       model: model || "gpt-4o-mini",
//       messages,
//       temperature: 0.7,
//       max_tokens: 500,
//       stream: true,
//     };

//     const response = await fetch(A4F_BASE_URL, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${A4F_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok || !response.body) {
//       throw new Error("Failed to start stream: " + response.status);
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();

//     const stream = new ReadableStream({
//       async start(controller) {
//         let buffer = "";

//         try {
//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             buffer += decoder.decode(value, { stream: true });

//             let boundary;
//             while ((boundary = buffer.indexOf("\n\n")) !== -1) {
//               const chunkLine = buffer.substring(0, boundary);
//               buffer = buffer.substring(boundary + 2);

//               if (chunkLine.startsWith("data: ")) {
//                 const jsonDataStr = chunkLine.substring(6).trim();
//                 if (!jsonDataStr || jsonDataStr === "[DONE]") continue;

//                 try {
//                   const jsonData = JSON.parse(jsonDataStr);
//                   const content = jsonData.choices?.[0]?.delta?.content;
//                   if (content) {
//                     const payload = JSON.stringify({ parts: [{ type: "text", text: content }] }) + "\n";
//                     controller.enqueue(new TextEncoder().encode(payload));
//                   }
//                 } catch (e) {
//                   console.error("Error parsing chunk:", e, jsonDataStr);
//                 }
//               }
//             }
//           }
//         } catch (err) {
//           console.error("Stream error:", err);
//           controller.error(err);
//         } finally {
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache, no-transform",
//       },
//     });
//   } catch (err) {
//     console.error("Streaming failed:", err);
//     return NextResponse.json({ error: "Failed to stream response" }, { status: 500 });
//   }
// }


// import { NextRequest } from "next/server";
// import OpenAI from "openai";

// const client = new OpenAI({
//   apiKey: process.env.A4F_API_KEY,
//   baseURL: "https://api.a4f.co/v1",
// });

// export async function POST(req: NextRequest) {
//   try {
//     const { messages, model } = await req.json();

//     if (!messages || !messages.length) {
//       return new Response(JSON.stringify({ error: "No messages provided" }), {
//         status: 400,
//       });
//     }

//     // Create a stream using ReadableStream
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           // SDK streaming method
//           const response = await client.chat.completions.stream({
//             model: model || "provider-6/gemini-2.5-flash-thinking",
//             messages,
//             temperature: 0.7,
//             max_tokens: 500,
//           });

//           // Iterate over each chunk
//           for await (const event of response as any) {
//             const content = event.choices?.[0]?.delta?.content;
//             if (content) {
//               const payload =
//                 JSON.stringify({ parts: [{ type: "text", text: content }] }) +
//                 "\n";
//               controller.enqueue(new TextEncoder().encode(payload));
//             }
//           }
//         } catch (err) {
//           console.error("Streaming error:", err);
//           controller.error(err);
//         } finally {
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache, no-transform",
//       },
//     });
//   } catch (err) {
//     console.error("Streaming failed:", err);
//     return new Response(JSON.stringify({ error: "Failed to start stream" }), {
//       status: 500,
//     });
//   }
// }


import { NextRequest } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.A4F_API_KEY,
  baseURL: "https://api.a4f.co/v1",
});

// Weather helper using Open-Meteo
async function getWeather(location: string) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location
    )}`
  );
  const geoData = await geoRes.json();
  const place = geoData.results?.[0];
  if (!place) return null;

  const { latitude, longitude, name } = place;

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
  );
  const weatherData = await weatherRes.json();
  const current = weatherData.current_weather;

  return {
    location: name,
    temperature: current?.temperature + "°C",
    condition: current?.weathercode || "Unknown",
  };
}

// Gutenberg search helper
async function searchGutenbergBooks(search_terms: string) {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(
    search_terms
  )}`;
  const response = await fetch(url);
  const data = await response.json();

  return data.results?.map((book: any) => ({
    id: book.id,
    title: book.title,
    authors: book.authors.map((a: any) => a.name),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !messages.length) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
      });
    }

    // Add system message to instruct model about tools
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start streaming from model
          const response = await client.chat.completions.stream({
            model: model || "provider-6/gemini-2.5-flash-thinking",
            messages: [systemMessage, ...messages],
            temperature: 0.7,
            max_tokens: 500,
          });

          for await (const event of response as any) {
            const content = event.choices?.[0]?.delta?.content;
            if (!content) continue;

            let toolParsed;
            try {
              toolParsed = JSON.parse(content);
            } catch {
              toolParsed = null;
            }

            if (toolParsed?.type?.startsWith("tool_")) {
              // Execute the tool
              switch (toolParsed.type) {
                case "tool_get_weather": {
                  const weather = await getWeather(toolParsed.location);
                  const payload = JSON.stringify({
                    parts: [{ type: "tool_get_weather", data: weather }],
                  });
                  controller.enqueue(new TextEncoder().encode(payload + "\n"));
                  break;
                }
                case "tool_search_books": {
                  const books = await searchGutenbergBooks(
                    toolParsed.search_terms
                  );
                  const payload = JSON.stringify({
                    parts: [{ type: "tool_search_books", data: books }],
                  });
                  controller.enqueue(new TextEncoder().encode(payload + "\n"));
                  break;
                }
              }
              continue; // skip normal text for tool calls
            }

            // Normal text
            const payload =
              JSON.stringify({ parts: [{ type: "text", text: content }] }) +
              "\n";
            controller.enqueue(new TextEncoder().encode(payload));
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("Streaming failed:", err);
    return new Response(JSON.stringify({ error: "Failed to start stream" }), {
      status: 500,
    });
  }
}

