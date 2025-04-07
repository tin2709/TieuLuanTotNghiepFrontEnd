// Login.js
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css"; // Keep your existing styles

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    // You might also check for refreshToken here if needed for auto-login logic later
    // const refreshToken = localStorage.getItem("refreshToken");

    // Simplified check: if authToken exists, assume logged in for initial render.
    // A robust implementation would involve verifying the token (or using the refresh token)
    // with the backend to confirm session validity.
    if (authToken) {
      console.log("Auth Token found, attempting to redirect based on stored role.");
      const storedRole = localStorage.getItem("userRole");
      if (storedRole) {
        setIsLoggedIn(true); // Set logged in state
        // Redirect immediately based on stored role
        if (storedRole === "1") { // Assuming '1' is Admin
          navigate("/admin");
        } else { // Other roles (Teacher, Staff, etc.)
          navigate("/homepage");
        }
      } else {
        // If role isn't stored but token is, maybe clear storage or try to fetch user info
        console.warn("Auth token exists but role is missing. Clearing potentially inconsistent state.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken"); // Clear refresh token too
        localStorage.removeItem("username");
        // localStorage.removeItem("password"); // Avoid storing password
        localStorage.removeItem("userRole");
        setIsLoggedIn(false);
      }
      setIsCheckingLogin(false); // Finish checking
    } else {
      setIsCheckingLogin(false); // No token, not logged in
    }
  }, [navigate]); // Added navigate to dependency array

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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

    // Clear previous login attempt data (important!)
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken"); // Clear previous refresh token too
    localStorage.removeItem("username");
    localStorage.removeItem("password"); // AVOID storing password ideally
    localStorage.removeItem("userRole");


    // 1. Call /checkUser to verify credentials and get role/ban status
    //    NOTE: This step might be redundant if /login handles all checks,
    //    but keeping it as per the original structure.
    try {
      const checkUserResponse = await fetch(
          `https://localhost:8080/checkUser?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
          {
            method: "GET",
          }
      );

      if (!checkUserResponse.ok) {
        // Handle non-2xx responses from /checkUser (e.g., 400 Bad Request, 500 Server Error)
        let errorMsg = `Không thể kiểm tra thông tin người dùng. (Mã lỗi: ${checkUserResponse.status})`;
        try {
          const errorData = await checkUserResponse.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) { /* Ignore if response is not JSON */ }

        Swal.fire({
          icon: "error",
          title: "Lỗi Kiểm Tra",
          text: errorMsg,
        });
        return; // Stop the process
      }

      // Assuming 2xx response means proceed
      const checkUserData = await checkUserResponse.json();

      if (checkUserData.status === "success") {
        const { quyen, isBanned } = checkUserData.data; // Assuming 'quyen' is the role ID

        // 2. Handle ban status (Check before attempting the actual login)
        // Adjust the role check if needed (e.g., maybe admins can log in even if banned?)
        if (isBanned) { // Check ban status regardless of role for simplicity, adjust if needed
          Swal.fire({
            icon: "error",
            title: "Tài khoản bị khóa",
            text: "Tài khoản của bạn đã bị quản trị viên khóa!",
          });
          return; // Stop here if banned
        }

        // 3. Proceed with /login to get tokens
        const loginFormData = new FormData();
        loginFormData.append('username', username);
        loginFormData.append('password', password);

        const loginResponse = await fetch("https://localhost:8080/login", {
          method: "POST",
          body: loginFormData, // Send username/password again
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json(); // This should be LoginResponseDTO

          // Check if both accessToken (token) and refreshToken are present
          if (loginData.token && loginData.refreshToken) {
            // 4. Store tokens, username, AND ROLE
            localStorage.setItem("authToken", loginData.token); // Use the correct field name from DTO
            localStorage.setItem("maTK", loginData.maTK); // Use the correct field name from DTO
            localStorage.setItem("refreshToken", loginData.refreshToken); // *** STORE REFRESH TOKEN ***
            localStorage.setItem("username", loginData.tenDangNhap || username); // Prefer username from response
            // localStorage.setItem("password", password); // AVOID storing password
            // Store the role (quyen) - Use role from loginData if available, fallback to checkUserData
            const userRole = loginData.quyen || quyen;
            localStorage.setItem("userRole", userRole.toString());
            localStorage.setItem('loginSuccessTimestamp', Date.now().toString());

            // 5. Redirect based on role AFTER successful /login and storage
            if (userRole === 1) { // Admin role (Assuming 5 based on backend ban logic)
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công (Admin)!",
                text: "Đang chuyển hướng đến trang quản trị...",
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                navigate("/admin");
              });
            } else { // Other roles -> Home page
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công!",
                text: "Đang chuyển hướng đến trang chủ...",
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                navigate("/homepage"); // Navigate to homepage for other roles
              });
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Lỗi Đăng nhập",
              text: loginData.message || "Không nhận được đủ thông tin token từ máy chủ.",
            });
          }
        } else {
          // Handle different login failure statuses specifically
          let errorMsg = "Lỗi trong quá trình đăng nhập.";
          if (loginResponse.status === 401) { // Unauthorized (Wrong password)
            errorMsg = "Sai tên đăng nhập hoặc mật khẩu!";
          } else if (loginResponse.status === 403) { // Forbidden (Account Banned - Although checked earlier, double-check)
            errorMsg = "Tài khoản này đã bị khóa.";
          } else if (loginResponse.status === 404) { // Not Found (User doesn't exist - less likely if checkUser passed)
            errorMsg = "Tài khoản không tồn tại.";
          } else {
            try {
              const errorData = await loginResponse.json();
              errorMsg = errorData.message || `Lỗi máy chủ (${loginResponse.status})`;
            } catch (e) { /* Ignore if response is not JSON */ }
          }
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: errorMsg,
          });
        }

      } else {
        // Handle /checkUser failure (e.g., invalid credentials reported by checkUser)
        Swal.fire({
          icon: "error",
          title: "Đăng nhập thất bại",
          text: checkUserData.message || "Sai tên đăng nhập hoặc mật khẩu!",
        });
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


  // --- JSX (No changes needed in the structure) ---
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
                      {/* Optional: Button to navigate based on role */}
                      <button onClick={() => {
                        const role = localStorage.getItem("userRole");
                        // Assuming role '5' is Admin based on backend logic for ban/unban
                        if (role === "5") navigate('/admin');
                        else navigate('/homepage');
                      }} className="btn btn-info mt-3">Đi tới trang chính</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitLogin}>
                      {/* Form inputs remain the same */}
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
                )}
                {/* Links should ideally be outside the conditional rendering */}
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