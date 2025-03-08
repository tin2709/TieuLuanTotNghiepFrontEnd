import './App.css';
import Login from './components/Login';
import Home from './components/Home/index';
import PhongMay from './components/PhongMay/phongmay';
import EditPhongMay from './components/PhongMay/editphongmay';
import AddPhongMay from './components/PhongMay/addphongmay';
import Tang from './components/Tang/tang';
import EditTang from './components/Tang/edittang';
import AddTang from './components/Tang/addtang';
import Register from './components/Register';
import ForgotPass from './components/Login/forgotpassword';
import VerifyOtp from './components/Login/verifyotp';
import UpdatePass from './components/Login/updatepassword';
import ProtectedRoute from "./components/auth/index";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />

          {/* Protected Routes */}
          <Route path="/phongmay" element={<ProtectedRoute component={PhongMay} />} />
          <Route path="/editphongmay" element={<ProtectedRoute component={EditPhongMay} />} />
          <Route path="/addphongmay" element={<ProtectedRoute component={AddPhongMay} />} />
          <Route path="/tang" element={<ProtectedRoute component={Tang} />} />
          <Route path="/edittang" element={<ProtectedRoute component={EditTang} />} />
          <Route path="/addtang" element={<ProtectedRoute component={AddTang} />} />

          {/* Unprotected Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpass" element={<ForgotPass />} />
          <Route path="/verifyotp" element={<VerifyOtp />} />
          <Route path="/updatepass" element={<UpdatePass />} />

          {/* Default route */}
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
