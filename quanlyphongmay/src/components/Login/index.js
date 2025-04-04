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

    if (authToken) {
      // Keep the existing token check
      // Important: Ensure your /checkingLogin endpoint correctly validates the token
      // Sending username/password here seems redundant if checking by token
      fetch(`https://localhost:8080/checkingLogin?username=&password=&token=${authToken}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              setIsLoggedIn(true);
              // Optional: Redirect based on role if needed after token validation
              // You might want to fetch the role here too if /checkingLogin provides it
              // Example: navigate based on data.quyen if available
              Swal.fire({
                icon: "info",
                title: "Bạn đã đăng nhập!",
                text: "Hệ thống ghi nhận bạn đã đăng nhập.",
                showConfirmButton: false,
                timer: 2000,
              });
              // Consider redirecting here if already logged in, e.g., navigate('/home') or navigate('/admin')
              // based on role fetched from /checkingLogin
              // Redirect immediately if already logged in
              navigate('/home'); // Or whatever default route is.  Consider role-based redirection here.


            } else {
              // Token might be invalid/expired, clear it
              localStorage.removeItem("authToken");
              localStorage.removeItem("username");
              localStorage.removeItem("password"); // Clear potentially stored credentials
              setIsLoggedIn(false);
            }
          })
          .catch((error) => {
            console.error("Error checking login:", error);
            // Assume token is invalid on error
            localStorage.removeItem("authToken");
            localStorage.removeItem("username");
            localStorage.removeItem("password");
            setIsLoggedIn(false);
          })
          .finally(() => setIsCheckingLogin(false));
    } else {
      setIsCheckingLogin(false);
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

    // 1. Call /checkUser to verify credentials and get role/ban status
    try {
      const checkUserResponse = await fetch(
          // Ensure URL encoding if username/password can contain special characters
          `https://localhost:8080/checkUser?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
          {
            method: "GET",
          }
      );

      if (checkUserResponse.ok) {
        const checkUserData = await checkUserResponse.json();

        if (checkUserData.status === "success") {
          const { quyen, isBanned } = checkUserData.data;

          // 2. Handle ban status FIRST (applies specifically to role 6 as per original logic)
          // NOTE: Clarify if ONLY role 6 can be banned, or if isBanned applies regardless of role.
          // Assuming original logic: only role 6 users are checked for ban here.
          if (quyen === 6 && isBanned) {
            Swal.fire({
              icon: "error",
              title: "Tài khoản bị khóa",
              text: "Tài khoản của bạn đã bị quản trị viên khóa!",
            });
            return; // Stop here if banned
          }

          // 3. If not banned (or not role 6), proceed with /login to get token
          // IMPORTANT: Sending form data again. Ensure /login expects this.
          // Consider if /login should just take username/password or if /checkUser could return the token directly.
          // Assuming /login is still necessary to *generate* the session/token.
          const loginResponse = await fetch("https://localhost:8080/login", {
            method: "POST",
            // Sending FormData is fine if the backend expects 'multipart/form-data' or 'application/x-www-form-urlencoded'
            // If backend expects JSON, use:
            // headers: { 'Content-Type': 'application/json' },
            // body: JSON.stringify({ username, password })
            body: new FormData(e.target),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();

            // Assuming /login returns a token on success
            if (loginData.token) {
              localStorage.setItem("authToken", loginData.token);
              // Storing username/password in localStorage is insecure. Avoid if possible.
              // If needed for display purposes, store username ONLY.
              localStorage.setItem("username", username);
              localStorage.setItem("password", password);
              // localStorage.setItem("password", password); // AVOID storing password

              // 4. Redirect based on role AFTER successful /login and token storage
              if (quyen === 5) { // Admin role
                Swal.fire({
                  icon: "success",
                  title: "Đăng nhập thành công (Admin)!",
                  text: "Đang chuyển hướng đến trang quản trị...",
                  showConfirmButton: false,
                  timer: 1500
                }).then(() => {
                  navigate("/admin");
                });
              } else if (quyen === 6) { // Regular user role -> Home page
                Swal.fire({
                  icon: "success",
                  title: "Đăng nhập thành công!",
                  text: "Đang chuyển hướng đến trang chủ...",
                  showConfirmButton: false,
                  timer: 1500
                }).then(() => {
                  navigate("/homepage"); // <<< CHANGED HERE
                });
              } else { // Other roles (if any) -> Phong May page (Default fallback)
                Swal.fire({
                  icon: "success",
                  title: "Đăng nhập thành công!",
                  text: "Đang chuyển hướng...",
                  showConfirmButton: false,
                  timer: 1500
                }).then(() => {
                  navigate("/phongmay"); // Fallback redirection
                });
              }
            } else {
              // Handle case where /login succeeds (status 2xx) but doesn't return a token
              Swal.fire({
                icon: "error",
                title: "Lỗi Đăng nhập",
                text: loginData.message || "Không nhận được token xác thực từ máy chủ.",
              });
            }
          } else {
            // Handle /login failure (e.g., server error during token generation)
            let errorMsg = "Lỗi trong quá trình đăng nhập.";
            try {
              const errorData = await loginResponse.json(); // Try to get error details
              errorMsg = errorData.message || errorMsg;
            } catch (e) { /* Ignore if response is not JSON */ }
            Swal.fire({
              icon: "error",
              title: "Đăng nhập thất bại",
              text: errorMsg,
            });
          }

        } else {
          // Handle /checkUser failure (invalid credentials or other user check issues)
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: checkUserData.message || "Sai tên đăng nhập hoặc mật khẩu!",
          });
        }
      } else {
        // Handle HTTP error for /checkUser (e.g., 404, 500)
        Swal.fire({
          icon: "error",
          title: "Lỗi Kết Nối",
          text: `Không thể kiểm tra thông tin người dùng. (Mã lỗi: ${checkUserResponse.status})`,
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


  // Keep the JSX structure, but conditionally render the form or "already logged in" message
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
                      {/* Optional: Add buttons to navigate away if needed */}
                      <button onClick={() => navigate('/home')} className="btn btn-info mt-3">Đi tới trang chủ</button>
                    </div>
                ) : (
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
                            required // Added basic HTML validation
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
                            required // Added basic HTML validation
                        />
                      </div>

                      <div className="mb-4">
                        <button type="submit" className="btn btn-primary w-100">
                          Đăng nhập
                        </button>
                      </div>
                    </form>
                )}
                {/* Links should ideally be outside the conditional rendering of the form vs logged in message */}
                {!isLoggedIn && !isCheckingLogin && ( // Only show these links if not logged in and not checking
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