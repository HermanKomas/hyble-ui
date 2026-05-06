import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { useIsMobile } from './lib/useMediaQuery.js';
import { Rail } from './components/shell/Rail.js';
import { HeaderBar } from './components/shell/HeaderBar.js';
import { AuthScreen } from './components/auth/AuthScreen.js';
import { CreatePage } from './routes/CreatePage.js';
import { OrdersPage } from './routes/OrdersPage.js';
import { Ico } from './components/shell/Icons.js';

type Theme = 'light' | 'dark';

function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const isMobile = useIsMobile();
  const activeSection = location.pathname.startsWith('/orders') ? 'orders' : 'create';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  }, [theme]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.1em', color: 'var(--ink-3)' }}>
          hyble
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const HEADERS: Record<'create' | 'orders', { title: string; subtitle: string }> = {
    create: { title: 'Create', subtitle: 'POS material' },
    orders: { title: 'Orders', subtitle: 'Your history' },
  };

  const header = HEADERS[activeSection];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile: compact top nav (replaces HeaderBar on mobile) */}
      {isMobile && (
        <Rail
          active={activeSection}
          onChange={(tab) => navigate(`/${tab}`)}
          compact
          user={user}
          rightSlot={
            <>
              <button
                className="btn btn-sm btn-ghost btn-icon"
                onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Ico.Sun s={16} /> : <Ico.Moon s={16} />}
              </button>
              <button
                className="btn btn-sm btn-ghost btn-icon"
                onClick={logout}
                title="Sign out"
              >
                <Ico.SignOut s={16} />
              </button>
            </>
          }
        />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop: left rail */}
        {!isMobile && (
          <Rail active={activeSection} onChange={(tab) => navigate(`/${tab}`)} user={user} collapsed={railCollapsed} onToggle={() => setRailCollapsed((c) => !c)} />
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!isMobile && (
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
          )}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Routes>
              <Route path="/create/:orderId?" element={<CreatePage />} />
              <Route path="/orders" element={<OrdersPage onNavigateToCreate={() => navigate('/create')} />} />
              <Route path="*" element={<Navigate to="/create" replace />} />
            </Routes>
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
