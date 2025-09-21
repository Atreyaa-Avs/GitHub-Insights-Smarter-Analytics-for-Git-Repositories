"use client";

import { useState, useRef } from "react";
import ConversationWrapper from "./ConversationWrapper";
import PromptInputWrapper from "./PromptInputWrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface MessagePart {
  type: "text";
  text: string;
}

interface MessageType {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  temporary?: boolean;
}

const modelsByCompany = [
  {
    company: "OpenAI",
    models: [
      { id: "provider-3/gpt-4.1-nano", name: "Gpt-4.1-nano" },
      { id: "provider-3/gpt-4o-mini", name: "Gpt-4o-mini" },
      { id: "provider-3/gpt-5-nano", name: "Gpt-5-nano" },
    ],
  },
  {
    company: "DeepSeek",
    models: [
      { id: "provider-3/deepseek-v3", name: "Deepseek-v3" },
      { id: "provider-1/deepseek-v3.1", name: "Deepseek-v3.1" },
    ],
  },
  {
    company: "Gemma",
    models: [{ id: "provider-6/gemma-3-27b-instruct", name: "Gemma-3" }],
  },
  {
    company: "Llama",
    models: [
      { id: "provider-1/llama-4-scout-17b-16e-instruct", name: "Llama-4" },
      { id: "provider-3/llama-3.3-70b", name: "Llama-3.3" },
      { id: "provider-3/llama-3-70b", name: "Llama-3" },
    ],
  },
  {
    company: "Qwen",
    models: [
      { id: "provider-1/qwen3-32b-fp8", name: "Qwen-3-32b" },
      {
        id: "provider-1/qwen3-coder-480b-a35b-instruct-fp8",
        name: "Qwen-3-480b",
      },
    ],
  },
  { company: "GLM", models: [{ id: "provider-1/glm-4.5-fp8", name: "GLM-4.5" }] },
  {
    company: "Mistral",
    models: [{ id: "provider-6/mistral-nemo-12b-instruct", name: "Mistral-Nemo" }],
  },
];

const MainChatbotComponent = () => {
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(modelsByCompany[0].models[0].id);
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [thinking, setThinking] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (message: { text?: string; files?: any[] }) => {
    const userText = message.text ?? "";
    if (!userText && !message.files?.length) return;

    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: userText || "Sent with attachments" }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setText("");
    setThinking(true);
    setStreaming(false);

    // Abort previous request if any
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.parts.map((p) => p.text).join(" "),
            })),
            { role: "user", content: userMessage.parts[0].text },
          ],
          model,
          webSearch: useWebSearch,
        }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantAdded = false;
      let assistantId = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary;
        while ((boundary = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);
          if (!line) continue;

          try {
            const parsed = JSON.parse(line);
            const chunkText = parsed.parts?.[0]?.text;

            if (chunkText) {
              if (!assistantAdded) {
                setThinking(false);
                setStreaming(true);

                assistantId = crypto.randomUUID();
                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    parts: [{ type: "text", text: "" }],
                    model:
                      modelsByCompany
                        .flatMap((c) => c.models)
                        .find((m) => m.id === model)?.name || model,
                    temporary: true,
                  },
                ]);
                assistantAdded = true;
              }

              for (let i = 0; i < chunkText.length; i++) {
                const char = chunkText[i];
                await new Promise((r) => setTimeout(r, 20));

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, parts: [{ type: "text", text: m.parts[0].text + char }] }
                      : m
                  )
                );
              }
            }
          } catch (err) {
            console.error("Failed to parse chunk:", line, err);
          }
        }
      }

      // Mark assistant as permanent
      setMessages((prev) =>
        prev.map((m) =>
          m.temporary && m.role === "assistant" ? { ...m, temporary: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request aborted by user");
      } else {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            parts: [{ type: "text", text: "Error fetching response" }],
          },
        ]);
      }
    } finally {
      setThinking(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClear = () => {
    setText("");
    abortControllerRef.current?.abort();
  };

  const handleModelChange = (newModel: string) => setModel(newModel);

  return (
    <div className="flex flex-col flex-1 max-w-3xl 2xl:max-w-5xl mx-auto p-6 rounded-lg border shadow-acternity">
      <div className="flex flex-col h-full space-y-4">
        <ConversationWrapper messages={messages} />

        {thinking && (
          <div className="flex items-end space-x-3">
            <Skeleton className="size-7 2xl:size-10 rounded-full" />
            <div className="flex w-full flex-col space-y-2">
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[65%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </div>
        )}

        <PromptInputWrapper
          text={text}
          setText={setText}
          model={model}
          setModel={handleModelChange}
          useMicrophone={useMicrophone}
          setUseMicrophone={setUseMicrophone}
          useWebSearch={useWebSearch}
          setUseWebSearch={setUseWebSearch}
          handleSubmit={handleSubmit}
          status={thinking ? "thinking" : streaming ? "streaming" : "idle"}
          models={modelsByCompany}
          // onClear={handleClear} // pass clear function
        />
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MainChatbotComponent;
