import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import { WebSocketProvider } from './contexts/websocketContext';
import { DeviceProvider } from './contexts/deviceContext';
import { ExperimentSyncProvider } from './contexts/experimentSyncContext';
import Navbar from './components/layout/Navbar';
import routes from './routes';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <DeviceProvider>
          <ExperimentSyncProvider>
            <Router>
              <div className="app">
                <Navbar />
                <main className="container">
                  <Routes>
                    {routes.map((route, index) => (
                      <Route key={index} path={route.path} element={route.element} />
                    ))}
                  </Routes>
                </main>
              </div>
            </Router>
          </ExperimentSyncProvider>
        </DeviceProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;