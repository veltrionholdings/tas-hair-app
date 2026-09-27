import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import InstallPrompt from './InstallPrompt';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

export default Layout;
