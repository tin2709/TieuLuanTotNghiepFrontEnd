// Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const clientId = "25503328823-80ck8k2dpchg36qs1beleuj5s1clqukh.apps.googleusercontent.com";
const API_BASE_URL = "https://localhost:8080"; // Define base URL for clarity

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // --- Modified function to add permissions ---
  const addPermissionsForRole = async (maTK, authToken, maQuyen) => {
    // --- Step 1: Initial checks ---
    if (!maTK || !authToken || maQuyen === 1) {
      // Don't add permissions for Admin role or if info is missing
      if (maQuyen === 1) {
        console.log(`User ID ${maTK}: Admin login detected, skipping default permission assignment.`);
      } else {
        console.error(`User ID ${maTK}: Missing maTK or authToken for permission assignment.`);
      }
      return;
    }

    console.log(`User ID ${maTK}: Checking existing permissions before assigning defaults for role: ${maQuyen}`);

    // --- Step 2: Check for existing permissions ---
    try {
      const checkResponse = await fetch(`${API_BASE_URL}/getUserPermissionsByUserId?userId=${maTK}&token=${authToken}`);

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        // Check if the 'permissions' array exists and is not empty
        if (Array.isArray(checkResult.permissions) && checkResult.permissions.length > 0) {
          console.log(`User ID ${maTK} already has ${checkResult.permissions.length} permissions. Skipping default assignment.`);
          // User has existing permissions, stop here.
          return;
        } else {
          console.log(`User ID ${maTK} has no existing permissions or permission list is empty. Proceeding with default assignment for role ${maQuyen}.`);
          // User has no existing permissions, continue to Step 3.
        }
      } else {
        // Handle specific error cases for the check API
        const errorData = await checkResponse.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ khi kiểm tra quyền (Status: ${checkResponse.status}).` }));
        console.error(`User ID ${maTK}: Failed to check for existing permissions (Status: ${checkResponse.status}):`, errorData.message);

        // If the check fails (especially 401), it's best to stop.
        if (checkResponse.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi xác thực',
            text: 'Phiên đăng nhập đã hết hạn khi kiểm tra quyền. Vui lòng đăng nhập lại.',
            didClose: () => navigate('/login') // Use navigate here
          });
        } else {
          // For other errors during check, warn the user but skip adding default permissions
          console.warn(`User ID ${maTK}: Could not verify existing permissions. Default assignment skipped to be safe.`);
          Swal.fire({ icon: 'warning', title: 'Lỗi kiểm tra quyền', text: errorData.message || 'Không thể kiểm tra quyền hiện tại. Bỏ qua việc gán quyền mặc định.', timer: 5000, position: 'top-end', showConfirmButton: false });
        }
        // In case of error during check, stop here.
        return;
      }
    } catch (error) {
      console.error(`User ID ${maTK}: Error during fetch for permissions check:`, error);
      Swal.fire({ icon: 'warning', title: 'Lỗi mạng', text: 'Lỗi kết nối khi kiểm tra quyền. Bỏ qua việc gán quyền mặc định.', timer: 5000, position: 'top-end', showConfirmButton: false });
      // In case of network error during check, stop here.
      return;
    }


    // --- Step 3: If no existing permissions found, proceed to assign defaults ---

    const baseResources = ["COMPUTER", "ROOM", "FLOOR", "BUILDING"];
    let actionsPerResource = [];

    // Define actions based on maQuyen (assuming 2 for Giao vien, 3 for Nhan vien)
    if (maQuyen === 2) { // Assuming maQuyen 2 is for Giao vien
      actionsPerResource = ["VIEW", "UPDATE"];
      console.log(`User ID ${maTK}: Assigning VIEW, UPDATE permissions per resource.`);
    } else if (maQuyen === 3) { // Assuming maQuyen 3 is for Nhan vien
      actionsPerResource = ["VIEW", "UPDATE", "CREATE", "DELETE"];
      console.log(`User ID ${maTK}: Assigning VIEW, UPDATE, CREATE, DELETE permissions per resource.`);
    } else {
      console.warn(`User ID ${maTK}: User has no permissions but maQuyen (${maQuyen}) is not 2 or 3. Cannot assign default permissions.`);
      return; // Cannot assign defaults if role is unknown or not 2/3
    }

    // Only proceed to build FormData and call add API if there are actions to assign
    if (actionsPerResource.length > 0) {
      const userIdsToSend = [];
      const resourcesToSend = [];
      const actionsToSend = [];

      // Build the flattened lists
      baseResources.forEach(resource => {
        actionsPerResource.forEach(action => {
          userIdsToSend.push(maTK);
          resourcesToSend.push(resource);
          actionsToSend.push(action);
        });
      });

      // Prepare FormData
      const permissionFormData = new FormData();
      permissionFormData.append('token', authToken); // Token as a request parameter
      userIdsToSend.forEach(id => permissionFormData.append('userIds', id));
      resourcesToSend.forEach(res => permissionFormData.append('resources', res));
      actionsToSend.forEach(act => permissionFormData.append('actions', act));

      console.log(`User ID ${maTK}: Attempting to add default permissions via addMultipleUserPermission API.`);
      try {
        const response = await fetch(`${API_BASE_URL}/addMultipleUserPermission`, {
          method: "POST",
          body: permissionFormData,
          // No 'Content-Type' header is needed for FormData
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`User ID ${maTK}: Default permissions assigned successfully:`, result);
          // Optionally show a small toast or log message for successful assignment
          Swal.fire({ icon: 'info', title: 'Quyền mặc định đã được gán!', text: result.message || '', timer: 3000, position: 'top-end', showConfirmButton: false });

        } else {
          const errorResult = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ khi gán quyền mặc định (Status: ${response.status}).` }));
          console.error(`User ID ${maTK}: Failed to assign default permissions (Status: ${response.status}):`, errorResult);
          // Show a warning about default permission assignment failure
          Swal.fire({ icon: 'warning', title: 'Lỗi gán quyền mặc định', text: errorResult.message || 'Không thể gán quyền mặc định cho tài khoản.', timer: 5000, position: 'top-end', showConfirmButton: false });
        }
      } catch (error) {
        console.error(`User ID ${maTK}: Error calling addMultipleUserPermission API:`, error);
        Swal.fire({ icon: 'warning', title: 'Lỗi mạng', text: 'Lỗi kết nối khi gán quyền mặc định.', timer: 5000, position: 'top-end', showConfirmButton: false });
      }
    } else {
      console.warn(`User ID ${maTK}: No default actions defined for maQuyen ${maQuyen}. Skipping assignment.`);
    }
  };
  // --- End of modified function ---


  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("userRole");

    if (authToken && storedRole) {
      console.log("Auth Token found, attempting to redirect based on stored role.");
      setIsLoggedIn(true);
      // Redirection logic remains the same here
      if (storedRole === "1") {
        navigate("/admin");
      } else {
        navigate("/homepage");
      }
    } else {
      // Clear potentially stale data if only token exists but no role
      if (localStorage.getItem("authToken")) {
        console.warn("Auth token exists but role is missing. Clearing potentially inconsistent state.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        localStorage.removeItem("maTK"); // Also remove maTK
        localStorage.removeItem("loginSuccessTimestamp");
        localStorage.removeItem("expireAt");
      }
      setIsLoggedIn(false);
    }
    setIsCheckingLogin(false); // Set checking to false after the check
  }, [navigate]); // Added navigate to dependency array

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    console.log('Google Login Success:', credentialResponse);
    const idToken = credentialResponse.credential;

    try {
      const decodedToken = jwtDecode(idToken);
      console.log("Decoded Token:", decodedToken);
      const email = decodedToken.email;
      console.log("Extracted Email:", email);

      if (!email) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng nhập Google',
          text: 'Không thể lấy email từ tài khoản Google.',
        });
        return;
      }

      // 1. Check if email exists in the system
      const response = await fetch(`${API_BASE_URL}/taikhoanemail?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        // Assuming 404 means not found, other errors might need different handling
        if (response.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Tài khoản chưa đăng ký",
            text: `Không tìm thấy tài khoản liên kết với email "${email}". Vui lòng đăng ký hoặc thử phương thức đăng nhập khác.`,
          });
        } else {
          throw new Error(`Lỗi khi kiểm tra email: ${response.status}`);
        }
        return;
      }

      const userDataFromEmailAPI = await response.json();
      console.log("userDataFromEmailAPI Response:", userDataFromEmailAPI);

      const googleLoginUsername = userDataFromEmailAPI.tenDangNhap;
      const googleLoginPassword = userDataFromEmailAPI.matKhau; // Note: Storing/fetching plain password is a security risk

      if (!googleLoginUsername || !googleLoginPassword) {
        Swal.fire({
          icon: "error",
          title: "Lỗi đăng nhập Google",
          text: "Không thể lấy thông tin đăng nhập từ tài khoản liên kết.",
        });
        return;
      }

      // 2. Use the retrieved username/password to perform a standard login
      const loginFormData = new FormData();
      loginFormData.append('username', googleLoginUsername);
      loginFormData.append('password', googleLoginPassword);

      try {
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          body: loginFormData,
        });
        console.log("Login API Response (Google):", loginResponse);

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log("Login Data (Google):", loginData);

          if (loginData.token && loginData.refreshToken && loginData.maTK !== undefined && loginData.maQuyen !== undefined) {
            // Store login details
            localStorage.setItem("authToken", loginData.token);
            localStorage.setItem("refreshToken", loginData.refreshToken);
            localStorage.setItem("maTK", loginData.maTK); // Store maTK
            localStorage.setItem("username", loginData.tenDangNhap || googleLoginUsername);
            localStorage.setItem("userRole", loginData.maQuyen.toString()); // Store role as string
            localStorage.setItem('loginSuccessTimestamp', Date.now().toString());
            // localStorage.setItem('expireAt', loginData.expiresAtTimestamp); // Assuming this is provided by backend

            // --- Add permissions based on role (asynchronous call) ---
            // This call now contains the check for existing permissions internally
            addPermissionsForRole(loginData.maTK, loginData.token, loginData.maQuyen);
            // --- End add permissions logic ---


            const userRole = loginData.maQuyen ;
            if (userRole === 1) {
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công (Admin)!",
                text: "Đang chuyển hướng đến trang quản trị...",
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                navigate("/admin");
              });
            } else {
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công!",
                text: "Đang chuyển hướng đến trang chủ...",
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                navigate("/homepage");
              });
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Lỗi Đăng nhập",
              text: loginData.message || "Không nhận được đủ thông tin token/role từ máy chủ.",
            });
          }
        } else {
          // Handle standard login failure after retrieving credentials via Google email
          try {
            const errorData = await loginResponse.json();
            Swal.fire({
              icon: "error",
              title: "Đăng nhập thất bại",
              text: errorData.message || "Lỗi đăng nhập sau khi xác thực Google.",
            });
          } catch (e) {
            Swal.fire({
              icon: "error",
              title: "Đăng nhập thất bại",
              text: "Lỗi không xác định sau khi xác thực Google.",
            });
          }
        }
      } catch (loginError) {
        console.error("Login error after Google email lookup:", loginError);
        Swal.fire({
          icon: "error",
          title: "Đã có lỗi xảy ra",
          text: "Không thể hoàn tất đăng nhập sau khi xác thực Google. Vui lòng thử lại!",
        });
      }
    } catch (error) {
      console.error("Google Login Error (Decoding Token/Email Check):", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng nhập Google',
        text: error.message || 'Không thể xử lý thông tin từ Google. Vui lòng thử lại.',
      });
    }
  };


  const handleGoogleLoginFailure = (error) => {
    console.error("Google Login Failure:", error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi đăng nhập Google',
      text: 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.',
    });
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    if (!username || !password) {
      Swal.fire({
        icon: "error",
        title: "Thiếu thông tin",
        text: "Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!",
      });
      return;
    }

    // Clear potential old login data before attempting new login
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("maTK");
    localStorage.removeItem("loginSuccessTimestamp");
    localStorage.removeItem("expireAt"); // Clear expiry timestamp too

    const loginFormData = new FormData();
    loginFormData.append('username', username);
    loginFormData.append('password', password);

    try {
      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        body: loginFormData,
      });
      console.log("Login API Response (Form):", loginResponse);

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log("Login Data (Form):", loginData);

        // Check if essential data is present
        if (loginData.token && loginData.refreshToken && loginData.maTK !== undefined && loginData.maQuyen !== undefined) {
          // Store login details
          localStorage.setItem("authToken", loginData.token);
          localStorage.setItem("refreshToken", loginData.refreshToken);
          localStorage.setItem("maTK", loginData.maTK); // Store maTK
          localStorage.setItem("username", loginData.tenDangNhap || username);
          localStorage.setItem("userRole", loginData.maQuyen.toString()); // Store role as string
          localStorage.setItem('loginSuccessTimestamp', Date.now().toString());
          // localStorage.setItem('expireAt', loginData.expiresAtTimestamp); // Assuming this is provided by backend


          // --- Add permissions based on role (asynchronous call) ---
          // This call now contains the check for existing permissions internally
          addPermissionsForRole(loginData.maTK, loginData.token, loginData.maQuyen);
          // --- End add permissions logic ---


          const userRole = loginData.maQuyen ;
          if (userRole === 1) {
            Swal.fire({
              icon: "success",
              title: "Đăng nhập thành công (Admin)!",
              text: "Đang chuyển hướng đến trang quản trị...",
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              navigate("/admin");
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Đăng nhập thành công!",
              text: "Đang chuyển hướng đến trang chủ...",
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              navigate("/homepage");
            });
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi Đăng nhập",
            text: loginData.message || "Không nhận được đủ thông tin token/role từ máy chủ.",
          });
        }
      } else {
        // Handle login failure
        try {
          const errorData = await loginResponse.json();
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: errorData.message || "Sai tên đăng nhập hoặc mật khẩu!",
          });
        } catch (e) {
          // Handle cases where the response body is not JSON (e.g., plain text error)
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: "Sai tên đăng nhập hoặc mật khẩu!",
          });
        }
      }

    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Đã có lỗi xảy ra",
        text: "Không thể kết nối đến máy chủ hoặc có lỗi không xác định. Vui lòng thử lại!",
      });
    }
  };


  return (
      <div className="container">
        <main className="hero-section">
          <img
              src="https://i.pinimg.com/736x/1c/fb/ec/1cfbec7b6e28bc517fa5c9c3e66cf22e.jpg"
              alt="Computer Lab Background"
              className="hero-image"
          />
          <div className="content">
            <div className="card custom-card">
              <div className="card-body p-4 p-md-5">
                <h3 className="text-center fw-bold mb-5 text-black">
                  Đăng nhập
                </h3>

                {isCheckingLogin ? (
                    <p className="text-center">Đang kiểm tra trạng thái đăng nhập...</p>
                ) : isLoggedIn ? (
                    <div className="text-center">
                      <p className="text-success">
                        Bạn đã đăng nhập vào hệ thống!
                      </p>
                      <button onClick={() => {
                        const role = localStorage.getItem("userRole");
                        if (role === "1") navigate('/admin');
                        else navigate('/homepage');
                      }} className="btn btn-info mt-3">Đi tới trang chính</button>
                    </div>
                ) : (
                    <>
                      <form onSubmit={handleSubmitLogin}>
                        <div className="form-group mb-4">
                          <label htmlFor="username" className="form-label">
                            Tài khoản
                          </label>
                          <input
                              type="text"
                              id="username"
                              name="username"
                              className="form-control"
                              placeholder="Nhập tài khoản"
                              value={formData.username}
                              onChange={handleInputChange}
                              required
                          />
                        </div>

                        <div className="form-group mb-4">
                          <label htmlFor="password" className="form-label">
                            Mật khẩu
                          </label>
                          <input
                              type="password"
                              id="password"
                              name="password"
                              className="form-control"
                              placeholder="Nhập mật khẩu"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                          />
                        </div>

                        <div className="mb-4">
                          <button type="submit" className="btn btn-primary w-100">
                            Đăng nhập
                          </button>
                        </div>
                      </form>

                      <div className="or-separator">
                        <hr className="separator-line" />
                        <span className="or-text">HOẶC</span>
                        <hr className="separator-line" />
                      </div>

                      <div className="mb-4 text-center">
                        <GoogleLogin
                            clientId={clientId}
                            buttonText="Đăng nhập với Google"
                            onSuccess={handleGoogleLoginSuccess}
                            onFailure={handleGoogleLoginFailure}
                            cookiePolicy={'single_host_origin'}
                        />
                      </div>
                    </>
                )}

                {!isLoggedIn && !isCheckingLogin && (
                    <>
                      <div className="text-center mt-3">
                        <Link to="/register" className="text-primary">
                          Chưa có tài khoản? Đăng ký ở đây
                        </Link>
                      </div>
                      <div className="text-center mt-2">
                        <Link to="/forgotpass" className="text-primary">
                          Quên mật khẩu?
                        </Link>
                      </div>
                    </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default Login;