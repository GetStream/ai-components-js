"use client";

import { UIMessage } from "@ai-sdk/react";
import { Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { useApp } from "@/contexts/app";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GetToolOutput } from "@/utils/helpers";
import ToolsOutput from "./tools";

export default function Messages() {
  const { messages, status, isLoadingMessages } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingMessages]);

  if (isLoadingMessages) {
    return (
      <div className="flex justify-center items-center h-full animate__animated animate__fadeIn">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex justify-center items-center flex-col h-full ">
        <h1 className="animate__animated animate__fadeInUp mb-0 ">
          <span className="ai-thinking">Welcome to AI Assistant</span>
        </h1>
        <p className="animate__animated animate__fadeInUp animate__delay-1s text-gray-500">
          Ready to help you with any questions or tasks. How can I assist you
          today?
        </p>
      </div>
    );
  }

  return (
    <div className="py-15 pl-3 max-w-3xl mx-auto space-y-5">
      {messages.map((m: UIMessage) => (
        <div
          key={m.id}
          className={`chat animate__animated animate__fadeIn ${
            m.role === "user" ? "chat-end" : "chat-start"
          }`}
        >
          <div className="flex gap-2 flex-wrap">
            {m.parts.map(
              (part, index) =>
                part.type === "file" &&
                part.url && (
                  <a
                    key={"file-" + index + m.id}
                    href={part.url}
                    target="_blank"
                    className="not-prose mb-2"
                  >
                    <Image
                      src={part.url}
                      alt={part.filename || "unknown"}
                      className="w-30 h-30 rounded-lg object-cover"
                      width={300}
                      height={300}
                    />
                  </a>
                )
            )}
          </div>
          <div
            className={`${
              m.role === "user"
                ? "chat-bubble chat-bubble-primary"
                : "max-w-full overflow-scroll"
            }`}
          >
            <Markdown>
              {m.parts
                .map((part: any) => (part.type === "text" ? part.text : ""))
                .join("")}
            </Markdown>
            <ToolsOutput parts={m.parts} />
          </div>
        </div>
      ))}
      {status === "submitted" && (
        <div className="flex gap-1 items-center text-sm my-4 animate-pulse">
          <Sparkles className="w-3 h-3 animate-pulse text-[#00ffe0]" />
          <span className="ai-thinking">Thinking</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
