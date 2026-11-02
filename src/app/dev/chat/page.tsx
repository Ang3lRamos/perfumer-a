import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatDesarrollo } from "@/features/chat-desarrollo/ChatDesarrollo";

export const metadata: Metadata = { title: "Chat de pruebas", robots: { index: false } };

export default function PaginaChatDesarrollo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ChatDesarrollo />;
}
