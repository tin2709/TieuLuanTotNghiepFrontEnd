// Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const clientId = "25503328823-80ck8k2dpchg36qs1beleuj5s1clqukh.apps.googleusercontent.com";

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
      console.log("Auth Token found, attempting to redirect based on stored role.");
      const storedRole = localStorage.getItem("userRole");
      if (storedRole) {
        setIsLoggedIn(true);
        if (storedRole === "1") {
          navigate("/admin");
        } else {
          navigate("/homepage");
        }
      } else {
        console.warn("Auth token exists but role is missing. Clearing potentially inconsistent state.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        setIsLoggedIn(false);
      }
      setIsCheckingLogin(false);
    } else {
      setIsCheckingLogin(false);
    }
  }, [navigate]);

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

      if (email) {
        const response = await fetch(`https://localhost:8080/taikhoanemail?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error(`Không tìm thấy tài khoản với email này. (Mã lỗi: ${response.status})`);
        }
        const userDataFromEmailAPI = await response.json();
        console.log("userDataFromEmailAPI Response:", userDataFromEmailAPI);

        const googleLoginUsername = userDataFromEmailAPI.tenDangNhap;
        const googleLoginPassword = userDataFromEmailAPI.matKhau;

        if (!googleLoginUsername || !googleLoginPassword) {
          Swal.fire({
            icon: "error",
            title: "Lỗi đăng nhập Google",
            text: "Không thể lấy thông tin đăng nhập từ tài khoản Google.",
          });
          return;
        }

        const loginFormData = new FormData();
        loginFormData.append('username', googleLoginUsername);
        loginFormData.append('password', googleLoginPassword);

        try {
          const loginResponse = await fetch("https://localhost:8080/login", {
            method: "POST",
            body: loginFormData,
          });
          console.log("Login API Response:", loginResponse);

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log("Login Data:", loginData);

              localStorage.setItem("password", formData.password);
            if (loginData.token && loginData.refreshToken) {
              localStorage.setItem("authToken", loginData.token);
              localStorage.setItem("maTK", loginData.maTK);
              localStorage.setItem("refreshToken", loginData.refreshToken);
              localStorage.setItem("username", loginData.tenDangNhap || googleLoginUsername);
              localStorage.setItem("userRole", loginData.maQuyen || userDataFromEmailAPI.quyen.maQuyen);
              localStorage.setItem('loginSuccessTimestamp', Date.now().toString());


              const userRole = loginData.quyen || userDataFromEmailAPI.quyen.maQuyen;
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
                text: loginData.message || "Không nhận được đủ thông tin token từ máy chủ.",
              });
            }
          } else {
            try {
              const errorData = await loginResponse.json();
              Swal.fire({
                icon: "error",
                title: "Đăng nhập thất bại",
                text: errorData.message || "Lỗi đăng nhập không xác định.",
              });
            } catch (e) {
              Swal.fire({
                icon: "error",
                title: "Đăng nhập thất bại",
                text: "Lỗi đăng nhập không xác định.",
              });
            }
          }
        } catch (loginError) {
          console.error("Login error after Google:", loginError);
          Swal.fire({
            icon: "error",
            title: "Đã có lỗi xảy ra",
            text: "Không thể đăng nhập sau khi xác thực Google. Vui lòng thử lại!",
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng nhập Google',
          text: 'Không thể lấy email từ tài khoản Google.',
        });
      }
    } catch (error) {
      console.error("Google Login Error (Fetching User Data):", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng nhập Google',
        text: error.message || 'Không thể lấy thông tin tài khoản từ email Google.',
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

    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");

    const loginFormData = new FormData();
    loginFormData.append('username', username);
    loginFormData.append('password', password);

    try {
      const loginResponse = await fetch("https://localhost:8080/login", {
        method: "POST",
        body: loginFormData,
      });
      console.log("Login API Response (Form):", loginResponse);

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log("Login Data (Form):", loginData);

        if (loginData.token && loginData.refreshToken) {
          localStorage.setItem("authToken", loginData.token);
          localStorage.setItem("maTK", loginData.maTK);
          localStorage.setItem("refreshToken", loginData.refreshToken);
          localStorage.setItem("username", loginData.tenDangNhap || username);
          localStorage.setItem("userRole", loginData.maQuyen);
          localStorage.setItem('loginSuccessTimestamp', Date.now().toString());
          localStorage.setItem('expireAt', loginData.expiresAtTimestamp);

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
            text: loginData.message || "Không nhận được đủ thông tin token từ máy chủ.",
          });
        }
      } else {
        try {
          const errorData = await loginResponse.json();
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: errorData.message || "Sai tên đăng nhập hoặc mật khẩu!",
          });
        } catch (e) {
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