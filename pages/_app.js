// pages/_app.js
-import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head><title>Progress Partner</title></Head>
      <Component {...pageProps} />
-     <Analytics />
    </>
  );
}
