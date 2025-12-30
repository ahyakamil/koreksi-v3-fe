import { Search, Home, Users, Video, Bell, Menu, MessageCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white">SJ</span>
            </div>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Social Journal"
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-blue-600 border-b-4 border-blue-600">
              <Home className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Users className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Video className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Menu className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?w=100&h=100&fit=crop" 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
