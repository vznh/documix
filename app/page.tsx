import { ChatForm } from "@/components/chat-form";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  return <ChatForm userId={userId || undefined} />;
}
