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
      </Head>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
  )
}
