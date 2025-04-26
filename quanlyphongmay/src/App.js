import React, { lazy, Suspense } from 'react';
import './App.css';
import {
  createBrowserRouter, // Thay thế BrowserRouter
  RouterProvider,    // Component để cung cấp router
  Outlet,            // Render route con
  Navigate           // Component điều hướng
} from 'react-router-dom';
import { Spin } from 'antd'; // Sử dụng Spin của Antd làm fallback

// Import ProtectedRoute (giữ nguyên)
import ProtectedRoute from "./components/auth/index";

// --- Import Loader (từ file riêng, phiên bản không throw lỗi) ---
import { labManagementLoader } from './components/Loader/phongmayLoader';
import { tangLoader } from './components/Loader/tangLoader';
import { maytinhLoader } from './components/Loader/maytinhLoader';
import { caThucHanhLoader } from './components/Loader/caThucHanhLoader';
import { taikhoanAdminLoader } from './components/Loader/taikhoanAdminLoader';
import { nhanvienAdminLoader } from './components/Loader/nhanvienAdminLoader';
import { giaovienAdminLoader } from './components/Loader/giaovienAdminLoader';
import { adminDashboardLoader } from './components/Loader/adminLoaders';


// --- Component hiển thị khi chờ tải code ---
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
);

// --- Layout Chung bao gồm Suspense và Outlet ---
// Tất cả các route con sẽ được render bên trong Outlet
// và được bọc bởi Suspense để xử lý lazy loading
const AppLayout = () => {
  return (
      <Suspense fallback={<LoadingFallback />}>
        {/* Có thể thêm Header/Footer/Sidebar chung ở đây nếu muốn */}
        <Outlet />
      </Suspense>
  );
};


// --- Định nghĩa Lazy Load cho TẤT CẢ các component của Route (Giữ nguyên) ---
const Login = lazy(() => import('./components/Login'));
const HomePage = lazy(() => import('./components/Home/homepage'));
const Home = lazy(() => import('./components/Home/index'));
const PhongMay = lazy(() => import('./components/PhongMay/phongmay'));
const CaThucHanh = lazy(() => import('./components/CaThucHanh/caThucHanh'));
const EditPhongMay = lazy(() => import('./components/PhongMay/editphongmay'));
const AddPhongMay = lazy(() => import('./components/PhongMay/addphongmay'));
const Tang = lazy(() => import('./components/Tang/tang'));
const EditTang = lazy(() => import('./components/Tang/edittang'));
const AddTang = lazy(() => import('./components/Tang/addtang'));
const Admin = lazy(() => import('./components/Admin/admin'));
const QuanLiTaiKhoan = lazy(() => import('./components/Admin/TaiKhoan/quanlitaikhoan'));
const QuanLiGiaoVien = lazy(() => import('./components/Admin/GiaoVien/quanligiaovien'));
const QuanLiNhanVien = lazy(() => import('./components/Admin/NhanVien/quanlinhanvien'));
const Maytinh = lazy(() => import('./components/maytinh/maytinh'));
const EditMayTinh = lazy(() => import('./components/maytinh/editmaytinh'));
const AddMayTinh = lazy(() => import('./components/maytinh/addmaytinh'));
const ReportBrokenNotes = lazy(() => import('./components/PhongMay/ReportBrokenNotes'))
const ReportBrokenDeviceNotes = lazy(() => import('./components/PhongMay/ReportBrokenDeviceNotes'))
const Register = lazy(() => import('./components/Register'));
const ForgotPass = lazy(() => import('./components/Login/forgotpassword'));
const VerifyOtp = lazy(() => import('./components/Login/verifyotp'));
const UpdatePass = lazy(() => import('./components/Login/updatepassword'));

// --- Cấu hình Router với createBrowserRouter ---
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // Sử dụng Layout chung
    // Không định nghĩa errorElement ở đây theo yêu cầu
    children: [
      // --- Default Route ---
      {
        index: true, // Route mặc định cho "/"
        element: <Navigate to="/home" replace /> // Điều hướng về /home
      },

      // --- Public Routes ---
      // Element là các component lazy load, Suspense trong AppLayout sẽ xử lý
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgotpass", element: <ForgotPass /> },
      { path: "verifyotp", element: <VerifyOtp /> },
      { path: "updatepass", element: <UpdatePass /> },
      { path: "homepage", element: <HomePage /> },

      // --- Protected Routes ---
      // Vẫn sử dụng ProtectedRoute như cũ
      {
        path: "phongmay",
        element: <ProtectedRoute component={PhongMay} />,
        loader: labManagementLoader, // Gán loader cho route này
        // Không có errorElement ở đây
      },
      {
        path: "editphongmay/:maPhong",
        element: <ProtectedRoute component={EditPhongMay} />,
        // loader: editPhongMayLoader, // Có thể thêm loader nếu cần fetch data phòng cụ thể
      },
      {
        path: "addphongmay",
        element: <ProtectedRoute component={AddPhongMay} />
      },
      {
        path: "tang",
        element: <ProtectedRoute component={Tang} />,
         loader: tangLoader, // Loader cho trang quản lý tầng nếu cần
      },
      {
        path: "report-notes/:roomId",
        element: <ProtectedRoute component={ReportBrokenNotes} />,
        // loader: editPhongMayLoader, // Có thể thêm loader nếu cần fetch data phòng cụ thể
      },
      {
        path: "reportdevice-notes/:roomId",
        element: <ProtectedRoute component={ReportBrokenDeviceNotes} />,
        // loader: editPhongMayLoader, // Có thể thêm loader nếu cần fetch data phòng cụ thể
      },

      {
        path: "edittang/:maTang",
        element: <ProtectedRoute component={EditTang} />,
        // loader: editTangLoader, // Loader cho trang sửa tầng nếu cần
      },
      {
        path: "addtang",
        element: <ProtectedRoute component={AddTang} />
      },
      {
        path: "maytinh",
        element: <ProtectedRoute component={Maytinh} />,
         loader: maytinhLoader, // Loader cho trang quản lý máy tính nếu cần
      },
      {
        path: "editmaytinh/:maMay",
        element: <ProtectedRoute component={EditMayTinh} />,
        // loader: editMayTinhLoader, // Loader cho trang sửa máy tính nếu cần
      },
      {
        path: "addmaytinh",
        element: <ProtectedRoute component={AddMayTinh} />,
      },
      {
        path: "cathuchanh",
        element: <ProtectedRoute component={CaThucHanh} />,
        loader: caThucHanhLoader
      },
      {
        path: "admin",
        element: <ProtectedRoute component={Admin} />,
        loader: adminDashboardLoader
      },
      {
        path: "quanlitaikhoan",
        element: <ProtectedRoute component={QuanLiTaiKhoan} />,
        loader: taikhoanAdminLoader, // Loader nếu cần
      },
      {
        path: "quanligiaovien",
        element: <ProtectedRoute component={QuanLiGiaoVien} />,
        loader: giaovienAdminLoader, // Loader nếu cần
      },
      {
        path: "quanlinhanvien",
        element: <ProtectedRoute component={QuanLiNhanVien} />,
        loader: nhanvienAdminLoader, // Loader nếu cần
      },

      // --- Catch-all hoặc trang 404 (Tùy chọn) ---
      // { path: "*", element: <NotFoundPage /> }
    ]
  }
  // Bạn có thể thêm các route không thuộc AppLayout ở đây (ví dụ: trang lỗi độc lập)
]);

// Component App giờ chỉ cần cung cấp RouterProvider
function App() {
  return (
      <RouterProvider router={router} />
      // Không cần <BrowserRouter>, <Suspense>, <Routes> ở đây nữa
  );
}

export default App;