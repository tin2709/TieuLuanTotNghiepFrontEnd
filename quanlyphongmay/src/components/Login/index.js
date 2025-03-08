import { useState, useEffect } from "react";
import { Link,useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isCheckingLogin, setIsCheckingLogin] = useState(true); // Kiểm tra trạng thái đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Trạng thái đăng nhập
  const navigate = useNavigate(); // Hook for navigation

  // Kiểm tra nếu người dùng đã đăng nhập
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
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

  // Xử lý đăng nhập
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    const { username, password } = formData;
    const authToken = localStorage.getItem("authToken"); // Lấy token từ localStorage

    if (!username || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
      return;
    }

    // Nếu đã có authToken, kiểm tra trạng thái đăng nhập
    if (authToken) {
      try {
        const response = await fetch(
            `https://localhost:8080/checkingLogin?username=${username}&password=${password}&token=${authToken}`
        );

        const data = await response.json();

        if (data.status === "success") {
          Swal.fire({
            icon: "info",
            title: "Bạn đã đăng nhập!",
            text: "Bạn vẫn đang đăng nhập vào hệ thống!",
            showConfirmButton: false,
            timer: 2000,
          });
          return; // Dừng lại, không tiếp tục đăng nhập
        }
      } catch (error) {
        console.error("Lỗi kiểm tra đăng nhập:", error);
      }
    }

    // Nếu chưa đăng nhập hoặc token không hợp lệ, tiến hành đăng nhập
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("https://localhost:8080/login", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;

        localStorage.setItem("authToken", token); // Lưu token vào localStorage

        Swal.fire({
          icon: "success",
          title: "Đăng nhập thành công!",
          text: "Bạn đã đăng nhập thành công!",
        }).then(() => {
          navigate("/phongmay"); // Chuyển hướng sau khi đăng nhập thành công
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Đăng nhập thất bại",
          text: "Sai tên đăng nhập hoặc mật khẩu!",
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
                <h3 className="text-center fw-bold mb-5 text-black">Đăng nhập</h3>

                {/* Nếu đang kiểm tra trạng thái đăng nhập thì hiển thị loading */}
                {isCheckingLogin ? (
                    <p className="text-center">Đang kiểm tra trạng thái đăng nhập...</p>
                ) : isLoggedIn ? (
                    <p className="text-center text-success">Bạn đã đăng nhập vào hệ thống!</p>
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
