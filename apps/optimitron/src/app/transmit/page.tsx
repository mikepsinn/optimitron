"use client"

import dynamic from "next/dynamic"

const ChatPage = dynamic(
  () => import("@/components/chat/ChatPage"),
  { ssr: false }
)

export default function TransmitPage() {
  return (
    <main>
      <ChatPage />
    </main>
  )
}
