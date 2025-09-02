// pages/_app.js
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Replace data-domain with your production domain if you change it later */}
        <script
          defer
          data-domain="amplyai-chatbot.vercel.app"
          src="https://plausible.io/js/script.js"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
