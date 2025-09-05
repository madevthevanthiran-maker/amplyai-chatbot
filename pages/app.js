// pages/app.js
import dynamic from "next/dynamic";

// Render ChatPanel only on the client (no SSR). Prevents localStorage errors.
const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false });

export default function AppPage() {
  return <ChatPanel />;
}

// Ensure this page is not statically exported (avoids prerender errors on /app)
export async function getServerSideProps() {
  return { props: {} };
}
