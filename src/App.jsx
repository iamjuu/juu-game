import { Outlet, Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
   
      <div className="p-4">
        <Outlet />
      </div>
  );
}

export default App;
