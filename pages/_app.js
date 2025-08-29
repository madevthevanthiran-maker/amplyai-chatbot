// pages/_app.js
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head><title>Progress Partner</title></Head>
      <Component {...pageProps} />
    </>
  );
}
