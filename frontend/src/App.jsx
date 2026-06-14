import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Exercise from "./pages/Exercise";
import RhythmGame from "./pages/RhythmGame";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exercise" element={<Exercise />} />
        <Route path="/rhythm" element={<RhythmGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
