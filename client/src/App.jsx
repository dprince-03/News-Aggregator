import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Preferences from './pages/Preferences';
import Personalized from './pages/Personalized';
import Saved from './pages/Saved';
import ArticleDetail from './pages/ArticleDetail';
import NotFound from './pages/NotFound';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<ArticleDetail />} />

              {/* Auth Routes - Only accessible when not logged in */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              {/* Private Routes - Only accessible when logged in */}
              <Route path="/personalized" element={
                <PrivateRoute>
                  <Personalized />
                </PrivateRoute>
              } />
              <Route path="/saved" element={
                <PrivateRoute>
                  <Saved />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/preferences" element={
                <PrivateRoute>
                  <Preferences />
                </PrivateRoute>
              } />

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
