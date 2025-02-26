import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import Register from './components/Register';
import {  BrowserRouter,Routes, Route, Navigate } from "react-router-dom";


function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/home" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<Navigate to="/home" replace />} />

    
</Routes>
</BrowserRouter>
  );
}

export default App;
