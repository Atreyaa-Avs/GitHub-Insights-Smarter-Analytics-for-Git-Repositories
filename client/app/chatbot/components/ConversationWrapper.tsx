import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai-elements/chain-of-thought";
import { Bot, SearchIcon, User } from "lucide-react";
import Image from "next/image";

interface Props {
  messages: any[];
}

const ConversationWrapper = ({ messages }: Props) => {
  return (
    <Conversation className="">
      <ConversationContent className="flex flex-col gap-2 min-h-full justify-end">
        {messages.map((message) => (
          <Message
            from={message.role}
            key={message.id}
            className="flex items-end gap-2"
          >
            {/* Message Content */}
            <MessageContent>
              {message.parts.map((part: any, i: number) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Response
                        className="font-medium font-inter"
                        key={`${message.id}-${i}`}
                      >
                        {part.text}
                      </Response>
                    );
                  case "reasoning":
                    return (
                      <ChainOfThought defaultOpen key={`${message.id}-${i}`}>
                        <ChainOfThoughtHeader />
                        <ChainOfThoughtContent>
                          {part.steps?.map((step: any, idx: number) => (
                            <ChainOfThoughtStep
                              key={idx}
                              icon={SearchIcon}
                              label={step.label || `Step ${idx + 1}`}
                              status={step.status || "complete"}
                            >
                              {step.results && step.results.length > 0 && (
                                <ChainOfThoughtSearchResults>
                                  {step.results.map(
                                    (result: string, rIdx: number) => (
                                      <ChainOfThoughtSearchResult key={rIdx}>
                                        {result}
                                      </ChainOfThoughtSearchResult>
                                    )
                                  )}
                                </ChainOfThoughtSearchResults>
                              )}
                              {step.text && <p>{step.text}</p>}
                            </ChainOfThoughtStep>
                          ))}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    );
                  case "tool_get_weather":
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 shadow-sm border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-2">
                          <SearchIcon className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold">Weather Update</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Location:</span>{" "}
                            {part.data.location}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Temperature:</span>{" "}
                            {part.data.temperature}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Condition:</span>{" "}
                            {part.data.condition}
                          </p>
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </MessageContent>

            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
              {message.role === "user" ? (
                <User className="w-5 h-5 text-muted-foreground" />
              ) : // show the model-icon for assistant
              message.model ? (
                <ModelIcon modelName={message.model} size={20} />
              ) : (
                <Bot className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};

export default ConversationWrapper;

interface ModelIconProps {
  modelName: string; // or modelId
  size?: number;
}

const ModelIcon: React.FC<ModelIconProps> = ({ modelName, size = 24 }) => {
  switch (modelName) {
    case "Gpt-4.1-nano":
    case "Gpt-4o-mini":
    case "Gpt-5-nano":
      return (
        <Image
          src="/icons/openai.svg"
          alt="OpenAI"
          width={size}
          height={size}
        />
      );
    case "Deepseek-v3":
    case "Deepseek-v3.1":
      return (
        <Image
          src="/icons/deepseek.svg"
          alt="OpenAI"
          width={size}
          height={size}
        />
      );
    case "Gemma-3":
      return (
        <Image
          src="/icons/gemini.svg"
          alt="OpenAI"
          width={size}
          height={size}
        />
      );
    case "Llama-4":
    case "Llama-3.3":
    case "Llama-3":
      return (
        <Image src="/icons/meta.svg" alt="OpenAI" width={size} height={size} />
      );
    case "Qwen-3-32b":
    case "Qwen-3-480b":
      return (
        <Image src="/icons/qwen.svg" alt="OpenAI" width={size} height={size} />
      );
    case "GLM-4.5":
      return (
        <Image src="/icons/glm.svg" alt="OpenAI" width={size} height={size} />
      );
    case "Mistral-Nemo":
      return (
        <Image
          src="/icons/mistral.svg"
          alt="OpenAI"
          width={size}
          height={size}
        />
      );
    default:
      return <Bot className="w-5 h-5 text-muted-foreground" />;
  }
};
