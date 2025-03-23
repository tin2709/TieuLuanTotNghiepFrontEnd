import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";

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
      // Keep the existing token check (assuming /checkingLogin validates the token)
      fetch(`https://localhost:8080/checkingLogin?username=&password=&token=${authToken}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              setIsLoggedIn(true);
              Swal.fire({
                icon: "info",
                title: "Bạn đã đăng nhập!",
                text: "Bạn đang đăng nhập vào hệ thống!",
                showConfirmButton: false,
                timer: 2000,
              });
            }
          })
          .catch((error) => console.error("Error checking login:", error))
          .finally(() => setIsCheckingLogin(false));
    } else {
      setIsCheckingLogin(false);
    }
  }, []);

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
        title: "Oops...",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
      return;
    }

    // 1. Call /checkUser to verify credentials and get role/ban status
    try {
      const checkUserResponse = await fetch(
          `https://localhost:8080/checkUser?username=${username}&password=${password}`,
          {
            method: "GET",
          }
      );

      if (checkUserResponse.ok) {
        const checkUserData = await checkUserResponse.json();

        if (checkUserData.status === "success") {
          const { quyen, isBanned } = checkUserData.data;

          // 2. Handle role and ban status
          if (quyen === 6 && isBanned) {
            Swal.fire({
              icon: "error",
              title: "Tài khoản bị khóa",
              text: "Bạn đã bị admin cấm truy cập!",
            });
            return; // Stop here if banned
          }

          // 3. If not banned, proceed with /login (assuming it sets the token)
          const loginResponse = await fetch("https://localhost:8080/login", {
            method: "POST",
            body: new FormData(e.target), // Use e.target directly for FormData
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.token;
            localStorage.setItem("authToken", token);

            // 4. Redirect based on role AFTER successful /login
            if (quyen === 5) {
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công!",
                text: "Bạn đã đăng nhập với quyền admin!",
              }).then(() => {
                navigate("/admin");
              });
            } else {
              Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công!",
                text: "Bạn đã đăng nhập thành công!",
              }).then(() => {
                navigate("/phongmay");
              });
            }
          } else {
            // Handle /login failure
            const errorData = await loginResponse.json(); // Try to get error details
            Swal.fire({
              icon: "error",
              title: "Đăng nhập thất bại",
              text: errorData.message || "Lỗi khi đăng nhập!",  // Show specific error if available
            });
          }


        } else {
          // Handle /checkUser failure (invalid credentials)
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: checkUserData.message || "Sai tên đăng nhập hoặc mật khẩu!",
          });
        }
      } else {
        // Handle HTTP error for /checkUser
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Có lỗi xảy ra khi kết nối đến máy chủ (checkUser)!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Có lỗi xảy ra",
        text: "Vui lòng thử lại sau!",
      });
      console.error(error);
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
                    <p className="text-center text-success">
                      Bạn đã đăng nhập vào hệ thống!
                    </p>
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
                        />
                      </div>

                      <div className="mb-4">
                        <button type="submit" className="btn btn-primary w-100">
                          Đăng nhập
                        </button>
                      </div>
                    </form>
                )}

                <br />
                <Link to="/register" className="text-primary">
                  Đăng ký ở đây
                </Link>
                <br />
                <br />
                <Link to="/forgotpass" className="text-primary">
                  Quên mật khẩu
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default Login;