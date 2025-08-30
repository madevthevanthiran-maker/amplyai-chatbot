import Head from "next/head";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head><title>Progress Partner</title></Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
