import { createContext, useContext, useState, useEffect } from 'react'
import translations from '../i18n/translations'

const LocaleContext = createContext()

export function LocaleProvider({ children }){
  const [locale, setLocale] = useState('id') // default Indonesian

  useEffect(()=>{
    const stored = typeof window !== 'undefined' && localStorage.getItem('locale')
    if(stored) setLocale(stored)
  },[])

  function changeLocale(l){
    setLocale(l)
    if(typeof window !== 'undefined') localStorage.setItem('locale', l)
  }

  function t(key){
    const group = translations[locale] || translations['id']
    return group[key] || translations['en'][key] || key
  }

  // support simple interpolation: t('key', {name: 'Alice'}) replaces {name}
  function tInterp(key, params={}){
    let str = t(key)
    Object.keys(params).forEach(k=>{
      const re = new RegExp(`\\{${k}\\}`,'g')
      str = str.replace(re, String(params[k]))
    })
    return str
  }

  return (
    <LocaleContext.Provider value={{ locale, changeLocale, t: tInterp }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(){
  return useContext(LocaleContext)
}
