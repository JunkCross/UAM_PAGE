//import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ArchivosCSV from './pages/ArchivosCSV.jsx';
import Experimentos from './pages/Experimentos.jsx';
import Reportes from './pages/Reportes.jsx';
import ExperimentoDashboard from './components/ExperimentoDashboard';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Sidebar>
        <Routes>
          <Route path="/" element={<Experimentos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/archivosCSV" element={<ArchivosCSV />} />
          <Route path="/experimentos/:id" element={<ExperimentoDashboard />} />
        </Routes>
      </Sidebar>
    </BrowserRouter>
  );
};

export default App;

