import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { RightSidebar } from './RightSidebar'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showRightSidebar?: boolean
  showHeader?: boolean
}

export function Layout({
  children,
  showSidebar = true,
  showRightSidebar = true,
  showHeader = true
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {showHeader && <Header />}

      <div className="flex max-w-[1920px] mx-auto">
        {showSidebar && <Sidebar />}

        <main className={`flex-1 ${showSidebar ? 'lg:ml-64' : ''} ${showRightSidebar ? 'xl:mr-80' : ''} px-4 py-4`}>
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>

        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  )
}