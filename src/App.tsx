import { HostApp } from './host/HostApp';
import { PlayerApp } from './player/PlayerApp';
import { ContractsHostApp } from './host/ContractsHostApp';
import { ContractsPlayerApp } from './player/ContractsPlayerApp';
import { ManualApp } from './host/ManualApp';
import { ShotBoxApp } from './host/ShotBoxApp';
import './App.css';

function App() {
  const path = window.location.pathname;

  // Player routes
  if (path === '/play') {
    return <PlayerApp />;
  }
  if (path === '/play-contracts') {
    return <ContractsPlayerApp />;
  }

  // Host routes
  if (path === '/contracts') {
    return <ContractsHostApp />;
  }
  if (path === '/manual') {
    return <ManualApp />;
  }
  if (path === '/shotbox') {
    return <ShotBoxApp />;
  }

  // Default: mode selector for host
  if (path === '/school') {
    return <HostApp />;
  }

  // Root: show mode picker
  return <ModePicker />;
}

function ModePicker() {
  return (
    <div className="host-app">
      <header className="host-header">
        <h1>HOW TO DRINK</h1>
        <p className="subtitle">CHOOSE YOUR GAME</p>
      </header>

      <div className="ct-mode-picker">
        <a href="/school" className="ct-mode-card">
          <h2>DRINKING SCHOOL</h2>
          <p className="ct-mode-desc">
            Classes, quizzes, and challenges.
            The professor picks random students for drinking tasks.
          </p>
          <span className="ct-mode-tag">CLASSIC</span>
        </a>

        <a href="/contracts" className="ct-mode-card ct-mode-contracts">
          <h2>CONTRACTS</h2>
          <p className="ct-mode-desc">
            Sign deals with hidden clauses.
            Use strategy tokens, build the Tab, and settle your debts.
          </p>
          <span className="ct-mode-tag">NEW</span>
        </a>

        <a href="/manual" className="ct-mode-card ct-mode-manual">
          <h2>DRINKING MANUAL</h2>
          <p className="ct-mode-desc">
            Shot Box style. One rule per turn. No arguing.
          </p>
          <span className="ct-mode-tag">NEW</span>
        </a>

        <a href="/shotbox" className="ct-mode-card ct-mode-shotbox">
          <h2>SHOT BOX</h2>
          <p className="ct-mode-desc">
            Random timer. Random victim. Take a shot.
          </p>
          <span className="ct-mode-tag">CLASSIC</span>
        </a>
      </div>
    </div>
  );
}

export default App;
