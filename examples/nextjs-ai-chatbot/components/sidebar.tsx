"use client";

import { useApp } from "@/contexts/app";
import { Dot, MessageSquarePlus, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { Chat as ChatType } from "@/types";
import { useParams } from "next/navigation";

export default function Sidebar({ title = "Chats" }) {
  const { chats } = useApp();
  const { id } = useParams();
  return (
    <>
      <h3 className="flex items-center gap-2">
        <MessageSquareText className="w-5 h-5" /> {title}
      </h3>
      <div className="animate__animated animate__fadeIn relative">
        {chats?.length > 0 ? (
          chats.map((chat: ChatType) => (
            <Link
              key={chat.id}
              href={`/${chat.id}`}
              title={chat.name}
              className={`mb-2 ml-[-10px] no-underline hover:underline block ${
                id === chat.id ? "text-primary" : ""
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <Dot className="flex-shrink-0" />
                <span className="truncate">{chat.name}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            No chats found
          </div>
        )}
      </div>
      <Link
        href="/"
        className="mb-2 btn btn-default btn-soft left-4 right-4 absolute bottom-2"
      >
        <MessageSquarePlus className="w-4 h-4" />
        New Chat
      </Link>
    </>
  );
}
