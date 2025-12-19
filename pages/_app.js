import '../styles/globals.css'
import Head from 'next/head'
import Header from '../components/Header'
import { AuthProvider } from '../context/AuthContext'

export default function App({ Component, pageProps }) {
  const title = Component.title || pageProps.title || 'Koreksi'
  return (
    <AuthProvider>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-512x512.png" />
        <link rel="shortcut icon" href="/icon-512x512.png" />
      </Head>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
  )
}
