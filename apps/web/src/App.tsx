import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth.js';
import { Rail } from './components/shell/Rail.js';
import { HeaderBar } from './components/shell/HeaderBar.js';
import { AuthScreen } from './components/auth/AuthScreen.js';
import { CreatePage } from './routes/CreatePage.js';
import { OrdersPage } from './routes/OrdersPage.js';
import { Ico } from './components/shell/Icons.js';

type Tab = 'create' | 'orders';
type Theme = 'light' | 'dark';

function AppShell() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('create');
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  }, [theme]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.1em', color: 'var(--ink-3)' }}>
          hyble
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const HEADERS: Record<Tab, { title: string; subtitle: string }> = {
    create: { title: 'Create', subtitle: 'POS material' },
    orders: { title: 'Orders', subtitle: 'Your history' },
  };

  const header = HEADERS[tab];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile: compact top nav */}
      {isMobile && (
        <Rail active={tab} onChange={setTab} compact user={user} />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop: left rail */}
        {!isMobile && (
          <Rail active={tab} onChange={setTab} user={user} collapsed={railCollapsed} onToggle={() => setRailCollapsed((c) => !c)} />
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <HeaderBar
            title={header.title}
            subtitle={header.subtitle}
            right={
              <>
                <button
                  className="btn btn-sm btn-ghost btn-icon"
                  onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Ico.Sun s={16} /> : <Ico.Moon s={16} />}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={logout}
                  style={{ fontSize: 12, color: 'var(--ink-3)' }}
                >
                  Sign out
                </button>
              </>
            }
          />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {tab === 'create' && <CreatePage />}
            {tab === 'orders' && <OrdersPage onNavigateToCreate={() => setTab('create')} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
