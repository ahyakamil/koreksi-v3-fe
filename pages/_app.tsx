import '../styles/globals.css'
import Head from 'next/head'
import ChatWidget from '../components/ChatWidget'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { LocaleProvider } from '../context/LocaleContext'
import { AppProps } from 'next/app'

function AppContent({ Component, pageProps }: AppProps) {
  const { user } = useAuth()
  const title = (Component as any).title || pageProps.title || 'Koreksi'
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-512x512.png" />
        <link rel="shortcut icon" href="/icon-512x512.png" />
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}></script>
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
            ` }} />
          </>
        )}
      </Head>
      <Component {...pageProps} />
      {user && (
        <ChatWidget
          apiUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}`}
          token={typeof window !== 'undefined' ? localStorage.getItem('accessToken')! : ''}
          userId={user.id}
        />
      )}
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <AppContent {...props} />
      </LocaleProvider>
    </AuthProvider>
  )
}
