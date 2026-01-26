import { HostApp } from './host/HostApp';
import { PlayerApp } from './player/PlayerApp';
import './App.css';

function App() {
  const isPlayer = window.location.pathname === '/play';

  if (isPlayer) {
    return <PlayerApp />;
  }

  return <HostApp />;
}

export default App;
