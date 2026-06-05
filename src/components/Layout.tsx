import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default Layout;
