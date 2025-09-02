// pages/_app.js
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Progress Partner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Plausible analytics */}
        <script defer data-domain="amplyai.org" src="https://plausible.io/js/script.js" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
