import React, { useState } from 'react';
import './App.css';
import TabSystem from './components/TabSystem';
import { ShiftProvider } from './ShiftContext';
import IsehaugKafeteriaLogo from './images/IsehaugKafeteria.png';
import JohansPubLogo from './images/JohansPub.png';
import LoginScreen from './components/LoginScreen';

function App() {
  const [department, setDepartment] = useState('Isehaug Kafeteria');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getLogo = () => {
    return department === 'Isehaug Kafeteria' ? IsehaugKafeteriaLogo : JohansPubLogo;
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <ShiftProvider>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <img src={getLogo()} alt={`${department} logo`} className="department-logo" />
            <h1 className="app-title">Vaktplanlegging</h1>
            <div className="department-selector">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Isehaug Kafeteria">Isehaug Kafeteria</option>
                <option value="Johans Pub">Johans Pub</option>
              </select>
            </div>
          </div>
        </header>
        <main>
          <TabSystem department={department} />
        </main>
      </div>
    </ShiftProvider>
  );
}

export default App;
