import Link from 'next/link';

interface Props {
  active: 'home' | 'history';
}

export default function NavHeader({ active }: Props) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧬</span>
          <span className="font-bold text-gray-900">Lab Assistant</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active === 'home'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            New report
          </Link>
          <Link
            href="/history"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active === 'history'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
