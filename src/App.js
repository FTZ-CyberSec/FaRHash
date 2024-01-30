import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddSchemaPage from './AddSchemaPage';
import CalculateFarHashPage from './CalculateFarHashPage';
import VerifyFarHashPage from './VerifyFarHashPage';
import './App.css';

function App() {
  const [buttonsMoved, setButtonsMoved] = useState(localStorage.getItem('buttonsMoved') === 'true');

  useEffect(() => {
    // Check if the buttons have already moved when the app loads
    const buttonsAlreadyMoved = localStorage.getItem('buttonsMoved') === 'true';
    setButtonsMoved(buttonsAlreadyMoved);
  }, []);

  useEffect(() => {
    // Update localStorage when buttonsMoved changes
    localStorage.setItem('buttonsMoved', buttonsMoved);
  }, [buttonsMoved]);

  const handleButtonClick = () => {
    setButtonsMoved(true);
  };

  return (
    <Router>
      <div className="app-container">
        <div className={`main-buttons ${buttonsMoved ? 'buttons-moved-up' : ''}`}>
          <Link to="/add-schema" className="glass-button" onClick={handleButtonClick}>Register New Schema</Link>
          <Link to="/calculate-far-hash" className="glass-button" onClick={handleButtonClick}>Register New FaR Hash</Link>
          <Link to="/verify-far-hash" className="glass-button" onClick={handleButtonClick}>Verify Far Hash</Link>
        </div>
        <Routes>
          <Route path="/add-schema" element={<AddSchemaPage />} />
          <Route path="/calculate-far-hash" element={<CalculateFarHashPage />} />
          <Route path="/verify-far-hash" element={<VerifyFarHashPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
