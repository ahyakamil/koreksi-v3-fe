import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import translations from '../i18n/translations'

type Locale = 'id' | 'en'

type LocaleContextType = {
  locale: Locale
  changeLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, any>) => any
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }){
  const [locale, setLocale] = useState<Locale>('id') // default Indonesian

  useEffect(()=>{
    const stored = typeof window !== 'undefined' && localStorage.getItem('locale')
    if(stored && (stored === 'id' || stored === 'en')) setLocale(stored as Locale)
  },[])

  function changeLocale(l: Locale){
    setLocale(l)
    if(typeof window !== 'undefined') localStorage.setItem('locale', l)
  }

  function t(key: string){
    const group = translations[locale] || translations['id']
    const result = group[key as keyof typeof group]
    if (Array.isArray(result)) return result
    return (result as string) || translations['en'][key as keyof typeof group] as string || key
  }

  // support simple interpolation: t('key', {name: 'Alice'}) replaces {name}
  function tInterp(key: string, params: Record<string, any> = {}){
    let str = t(key)
    if (typeof str === 'string') {
      let s = str as string
      Object.keys(params).forEach(k=>{
        const re = new RegExp(`\\{${k}\\}`,'g')
        s = s.replace(re, String(params[k]))
      })
      return s
    }
    return str
  }

  return (
    <LocaleContext.Provider value={{ locale, changeLocale, t: tInterp }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(){
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
