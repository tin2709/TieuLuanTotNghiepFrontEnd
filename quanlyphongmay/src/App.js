import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import Register from './components/Register';
import ForgotPass from './components/Login/forgotpassword';
import VerifyOtp from './components/Login/verifyotp';
import UpdatePass from './components/Login/updatepassword';
import {  BrowserRouter,Routes, Route, Navigate } from "react-router-dom";


function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/home" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgotpass" element={<ForgotPass />} />
    <Route path="/verifyotp" element={<VerifyOtp />} />
    <Route path="/updatepass" element={<UpdatePass />} />
    <Route path="/" element={<Navigate to="/home" replace />} />

    
</Routes>
</BrowserRouter>
  );
}

export default App;
