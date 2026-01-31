import { HostApp } from './host/HostApp';
import { PlayerApp } from './player/PlayerApp';
import { ContractsHostApp } from './host/ContractsHostApp';
import { ContractsPlayerApp } from './player/ContractsPlayerApp';
import { ManualApp } from './host/ManualApp';
import { ShotBoxApp } from './host/ShotBoxApp';
import { GhostHostApp } from './host/GhostHostApp';
import { GhostHostPlayerApp } from './player/GhostHostPlayerApp';
import { BettingApp } from './host/BettingApp';
import { BettingPlayerApp } from './player/BettingPlayerApp';
import { SpinWheelApp } from './host/SpinWheelApp';
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
  if (path === '/play-ghosthost') {
    return <GhostHostPlayerApp />;
  }
  if (path === '/play-betting') {
    return <BettingPlayerApp />;
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
  if (path === '/ghosthost') {
    return <GhostHostApp />;
  }
  if (path === '/betting') {
    return <BettingApp />;
  }
  if (path === '/spinwheel') {
    return <SpinWheelApp />;
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

        <a href="/ghosthost" className="ct-mode-card ct-mode-ghosthost">
          <h2>GHOST HOST</h2>
          <p className="ct-mode-desc">
            One player is secretly the Ghost with missions.
            Mortals must identify them before time runs out.
          </p>
          <span className="ct-mode-tag">NEW</span>
        </a>

        <a href="/betting" className="ct-mode-card ct-mode-betting">
          <h2>RACE BETTING</h2>
          <p className="ct-mode-desc">
            Bet sips or shots on race cars.
            Winners give drinks, losers drink their bets.
          </p>
          <span className="ct-mode-tag">NEW</span>
        </a>

        <a href="/spinwheel" className="ct-mode-card ct-mode-spinwheel">
          <h2>SPIN THE WHEEL</h2>
          <p className="ct-mode-desc">
            Take turns spinning the wheel of fate.
            Land on it. Drink it. No escaping destiny.
          </p>
          <span className="ct-mode-tag">NEW</span>
        </a>
      </div>
    </div>
  );
}

export default App;
