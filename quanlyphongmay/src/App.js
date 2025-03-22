import './App.css';
import Login from './components/Login';
import Home from './components/Home/index';
import PhongMay from './components/PhongMay/phongmay';
import EditPhongMay from './components/PhongMay/editphongmay';
import AddPhongMay from './components/PhongMay/addphongmay';
import Tang from './components/Tang/tang';
import EditTang from './components/Tang/edittang';
import AddTang from './components/Tang/addtang';
import Maytinh from './components/maytinh/maytinh';
import EditMayTinh from './components/maytinh/editmaytinh';
import AddMayTinh from './components/maytinh/addmaytinh';
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
          <Route path="/editphongmay/:maPhong" element={<ProtectedRoute component={EditPhongMay} />} />
          <Route path="/addphongmay" element={<ProtectedRoute component={AddPhongMay} />} />
          <Route path="/tang" element={<ProtectedRoute component={Tang} />} />
          <Route path="/edittang/:maTang" element={<ProtectedRoute component={EditTang} />} />
          <Route path="/addtang" element={<ProtectedRoute component={AddTang} />} />
          <Route path="/maytinh" element={<ProtectedRoute component={Maytinh} />} />
          <Route path="/editmaytinh/:maMayTinh" element={<ProtectedRoute component={EditMayTinh} />} />
          <Route path="/addmaytinh" element={<ProtectedRoute component={AddMayTinh} />} />
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
