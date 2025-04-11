import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ava from "../../img/addAvatar.png";
import { useDispatch } from "react-redux";
import { saveUserAccount } from "../../redux/reducers/userReducer";
import Swal from "sweetalert2";
import "./style.css";

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

export default function Register() {
  const [ckbRemeber, setCkbRemeber] = useState(true);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    soDienThoai: "",
  });
  const [chucVu, setChucVu] = useState("Nhân viên");
  const [hocVi, setHocVi] = useState("");
  const [maKhoa, setMaKhoa] = useState("");
  const [dsKhoa, setDSKhoa] = useState([]);
  const [dsChucVuOptions, setDSChucVuOptions] = useState([]);
  const [maCVNV, setMaCVNV] = useState("");

  // Error states for validation
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [soDienThoaiError, setSoDienThoaiError] = useState("");
  const [hocViError, setHocViError] = useState("");
  const [maKhoaError, setMaKhoaError] = useState("");
  const [maCVNVError, setMaCVNVError] = useState("");

  // Input border style states
  const [usernameBorder, setUsernameBorder] = useState("");
  const [passwordBorder, setPasswordBorder] = useState("");
  const [emailBorder, setEmailBorder] = useState("");
  const [soDienThoaiBorder, setSoDienThoaiBorder] = useState("");
  const [hocViBorder, setHocViBorder] = useState("");
  const [maKhoaBorder, setMaKhoaBorder] = useState("");
  const [maCVNVBorder, setMaCVNVBorder] = useState("");


  // Form validity state
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDSKhoa = async () => {
      try {
        const response = await fetch("https://localhost:8080/DSKhoa");
        if (response.ok) {
          const data = await response.json();
          setDSKhoa(data);
        } else {
          console.error("Failed to fetch DSKhoa");
        }
      } catch (error) {
        console.error("Error fetching DSKhoa:", error);
      }
    };

    const fetchDSChucVu = async () => {
      try {
        const response = await fetch("https://localhost:8080/DSChucVu");
        if (response.ok) {
          const data = await response.json();
          setDSChucVuOptions(data);
        } else {
          console.error("Failed to fetch DSChucVu");
        }
      } catch (error) {
        console.error("Error fetching DSChucVu:", error);
      }
    };

    fetchDSKhoa();
    fetchDSChucVu();
  }, []);

  useEffect(() => {
    checkFormValidity();
  }, [emailError, passwordError, soDienThoaiError, hocViError, maKhoaError, maCVNVError, formData, chucVu, hocVi, maKhoa, maCVNV]);

  const checkFormValidity = () => {
    let formValid = true;

    if (!formData.username) formValid = false;
    if (!formData.email) formValid = false;
    if (!formData.password) formValid = false;
    if (emailError) formValid = false;
    if (passwordError) formValid = false;

    if (chucVu === "Giáo viên") {
      if (!hocVi) formValid = false;
      if (!maKhoa) formValid = false;
      if (!formData.soDienThoai) formValid = false;
      if (soDienThoaiError) formValid = false;
      if (hocViError) formValid = false;
      if (maKhoaError) formValid = false;
    } else if (chucVu === "Nhân viên") {
      if (!formData.soDienThoai) formValid = false;
      if (!maCVNV) formValid = false;
      if (soDienThoaiError) formValid = false;
      if (maCVNVError) formValid = false;
    }

    setIsFormValid(formValid);
  };

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleChangeCheckbox = (e) => {
    setCkbRemeber(e.target.checked);
  };

  const validateEmail = (email) => {
    if (!email.includes("@")) {
      return "Email phải chứa ký tự '@'";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return "";
  };

  const validateSoDienThoai = (soDienThoai) => {
    const phoneRegex = /^(?:\d{10}|\d{11})(?![a-zA-Z])+$/;
    if (chucVu === 'Giáo viên' || chucVu === 'Nhân viên') {
      if (!soDienThoai) {
        return "Số điện thoại không được để trống";
      }
      if (!phoneRegex.test(soDienThoai)) {
        return "Số điện thoại không đúng định dạng (10-11 số)";
      }
    }
    return "";
  };


  const debouncedValidateEmail = useCallback(
      debounce((value) => {
        const error = validateEmail(value);
        setEmailError(error);
        setEmailBorder(error ? "#dc3545" : "#28a745");
      }, 500), []
  );

  const debouncedValidatePassword = useCallback(
      debounce((value) => {
        const error = validatePassword(value);
        setPasswordError(error);
        setPasswordBorder(error ? "#dc3545" : "#28a745");
      }, 500), []
  );

  const debouncedValidateSoDienThoai = useCallback(
      debounce((value) => {
        const error = validateSoDienThoai(value);
        setSoDienThoaiError(error);
        setSoDienThoaiBorder(error ? "#dc3545" : "#28a745");
      }, 500), []
  );


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    let error = '';
    let isValid = true;

    if (name === "email") {
      debouncedValidateEmail(value);
      error = validateEmail(value);
      isValid = !error;
    } else if (name === "password") {
      debouncedValidatePassword(value);
      error = validatePassword(value);
      isValid = !error;
    } else if (name === "soDienThoai") {
      debouncedValidateSoDienThoai(value);
      error = validateSoDienThoai(value);
      isValid = !error;
    } else if (name === "username") {
      setUsernameError("");
      setUsernameBorder("");
      isValid = true;
    }

    if (isValid) {
      if (name === 'email') {
        setEmailError("");
        setEmailBorder("");
      } else if (name === 'password') {
        setPasswordError("");
        setPasswordBorder("");
      } else if (name === 'soDienThoai') {
        setSoDienThoaiError("");
        setSoDienThoaiBorder("");
      }
    }
  };

  const handleChucVuChange = (e) => {
    setChucVu(e.target.value);
    if (e.target.value === "Nhân viên") {
      setHocVi("");
      setMaKhoa("");
      setHocViError("");
      setMaKhoaError("");
      setHocViBorder("");
      setMaKhoaBorder("");
      setMaCVNVError(maCVNV ? "" : "Vui lòng chọn chức vụ");
      setMaCVNVBorder(maCVNV ? "" : "#dc3545");
      debouncedValidateSoDienThoai(formData.soDienThoai);
    } else if (e.target.value === "Giáo viên") {
      setMaCVNV("");
      setMaCVNVError("");
      setMaCVNVBorder("");
      setMaCVNVError("");
      setMaCVNVBorder("");
      setHocViError(hocVi ? "" : "Vui lòng chọn học vị");
      setMaKhoaError(maKhoa ? "" : "Vui lòng chọn khoa");
      setHocViBorder(hocVi ? "" : "#dc3545");
      setMaKhoaBorder(maKhoa ? "" : "#dc3545");
      debouncedValidateSoDienThoai(formData.soDienThoai);
    }
  };

  const handleHocViChange = (e) => {
    setHocVi(e.target.value);
    setHocViError("");
    setHocViBorder("");
  };

  const handleSoDienThoaiChange = (e) => {
    setFormData({...formData, soDienThoai: e.target.value});
    debouncedValidateSoDienThoai(e.target.value);
    const error = validateSoDienThoai(e.target.value);
    if (!error && (chucVu === 'Giáo viên' || chucVu === 'Nhân viên')) {
      setSoDienThoaiError("");
      setSoDienThoaiBorder("");
    }
  };


  const handleMaKhoaChange = (e) => {
    setMaKhoa(e.target.value);
    setMaKhoaError("");
    setMaKhoaBorder("");
  };

  const handleMaCVNVChange = (e) => {
    setMaCVNV(e.target.value);
    setMaCVNVError("");
    setMaCVNVBorder("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      Swal.fire({
        icon: "error",
        title: "Lỗi đăng ký",
        text: "Vui lòng kiểm tra và sửa các lỗi trên form trước khi đăng ký!",
      });
      return;
    }

    const { username, email, password, soDienThoai } = formData;

    try {
      let maQuyen = chucVu === "Nhân viên" ? 3 : 2;

      const formDataToSendTaiKhoan = new FormData();
      formDataToSendTaiKhoan.append("tenDangNhap", username);
      formDataToSendTaiKhoan.append("matKhau", password);
      formDataToSendTaiKhoan.append("maQuyen", maQuyen);
      formDataToSendTaiKhoan.append("email", email);
      if (avatar.file) {
        formDataToSendTaiKhoan.append("imageFile", avatar.file);
      }

      const responseTaiKhoan = await fetch("https://localhost:8080/luutaikhoan", {
        method: "POST",
        body: formDataToSendTaiKhoan,
      });

      if (!responseTaiKhoan.ok) {
        const errorData = await responseTaiKhoan.text();
        Swal.fire({
          icon: "error",
          title: "Đăng ký tài khoản thất bại",
          text: errorData || "Có lỗi xảy ra khi lưu tài khoản. Vui lòng thử lại sau!",
        });
        return;
      }

      const responseTaiKhoanJson = await responseTaiKhoan.json();
      localStorage.setItem('taiKhoanInfo', JSON.stringify(responseTaiKhoanJson));
      const storedTaiKhoanInfo = localStorage.getItem('taiKhoanInfo');
      const taiKhoanData = JSON.parse(storedTaiKhoanInfo);
      const maTKFromStorage = taiKhoanData.maTK;


      if (chucVu === "Giáo viên") {
        const formDataLuuGiaoVien = new FormData();
        formDataLuuGiaoVien.append("hoTen", username);
        formDataLuuGiaoVien.append("soDienThoai", soDienThoai);
        formDataLuuGiaoVien.append("email", email);
        formDataLuuGiaoVien.append("hocVi", hocVi);
        formDataLuuGiaoVien.append("taiKhoanMaTK", maTKFromStorage);
        formDataLuuGiaoVien.append("khoaMaKhoa", maKhoa);

        console.log("Data sent to LuuGiaoVien API:");
        for (let pair of formDataLuuGiaoVien.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }

        const responseLuuGiaoVien = await fetch("https://localhost:8080/LuuGiaoVien", {
          method: "POST",
          body: formDataLuuGiaoVien,
        });

        if (!responseLuuGiaoVien.ok) {
          const errorDataGV = await responseLuuGiaoVien.text();
          Swal.fire({
            icon: "error",
            title: "Đăng ký Giáo Viên thất bại",
            text: errorDataGV || "Có lỗi xảy ra khi lưu thông tin giáo viên. Vui lòng thử lại sau!",
          });
          return;
        }
      } else if (chucVu === "Nhân viên") {
        const formDataLuuNhanVien = new FormData();
        formDataLuuNhanVien.append("tenNV", username);
        formDataLuuNhanVien.append("email", email);
        formDataLuuNhanVien.append("sDT", soDienThoai);
        formDataLuuNhanVien.append("maCV", maCVNV);
        formDataLuuNhanVien.append("taiKhoanMaTK", maTKFromStorage);

        console.log("Data sent to LuuNhanVien API:");
        for (let pair of formDataLuuNhanVien.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }

        const responseLuuNhanVien = await fetch("https://localhost:8080/LuuNhanVien", {
          method: "POST",
          body: formDataLuuNhanVien,
        });

        if (!responseLuuNhanVien.ok) {
          const errorDataNV = await responseLuuNhanVien.text();
          Swal.fire({
            icon: "error",
            title: "Đăng ký Nhân viên thất bại",
            text: errorDataNV || "Có lỗi xảy ra khi lưu thông tin nhân viên. Vui lòng thử lại sau!",
          });
          return;
        }
      }

      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công!",
        text: "Tài khoản đã được lưu thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập.",
      }).then(() => {
        localStorage.removeItem('taiKhoanInfo');
        navigate("/login");
      });
    } catch (error) {
      localStorage.removeItem('taiKhoanInfo');
      Swal.fire({
        icon: "error",
        title: "Đăng ký thất bại",
        text: error.message || "Có lỗi xảy ra. Vui lòng thử lại sau!",
      });
      console.error("Registration error:", error);
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
                <h3 className="text-center fw-bold mb-5 text-black">Đăng ký</h3>

                <form onSubmit={handleSubmit}>
                  {/* Username */}
                  <div className="form-group mb-3">
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
                        style={{ borderColor: usernameBorder }}
                    />
                    {usernameError && <p className="error-message below-input-error">{usernameError}</p>}
                  </div>

                  {/* Password */}
                  <div className="form-group mb-2">
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
                        style={{ borderColor: passwordBorder }}
                    />
                    {passwordError && <p className="error-message below-input-error">{passwordError}</p>}
                  </div>

                  {/* Email */}
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Nhập email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{ borderColor: emailBorder }}
                    />
                    {emailError && <p className="error-message below-input-error">{emailError}</p>}
                  </div>

                  {/* Chức vụ */}
                  <div className="form-group mb-4">
                    <label htmlFor="chucVu" className="form-label">
                      Quyền hạn
                    </label>
                    <select
                        id="chucVu"
                        name="chucVu"
                        className="form-control custom-select"
                        value={chucVu}
                        onChange={handleChucVuChange}
                    >
                      <option value="Nhân viên">Nhân viên</option>
                      <option value="Giáo viên">Giáo viên</option>
                    </select>
                  </div>

                  {/* Conditional fields for Giáo viên */}
                  {chucVu === "Giáo viên" && (
                      <>
                        {/* Học vị */}
                        <div className="form-group mb-4">
                          <label htmlFor="hocVi" className="form-label">
                            Học vị
                          </label>
                          <select
                              id="hocVi"
                              name="hocVi"
                              className="form-control custom-select"
                              value={hocVi}
                              onChange={handleHocViChange}
                              style={{ borderColor: hocViBorder }}
                          >
                            <option value="">Chọn học vị</option>
                            <option value="Thạc sĩ">Thạc sĩ</option>
                            <option value="Tiến sĩ">Tiến sĩ</option>
                          </select>
                          {hocViError && <p className="error-message below-input-error">{hocViError}</p>}
                        </div>

                        {/* Số điện thoại */}
                        <div className="form-group mb-4">
                          <label htmlFor="soDienThoai" className="form-label">
                            Số điện thoại
                          </label>
                          <input
                              type="text"
                              id="soDienThoai"
                              name="soDienThoai"
                              className="form-control"
                              placeholder="Nhập số điện thoại"
                              value={formData.soDienThoai}
                              onChange={handleInputChange}
                              style={{ borderColor: soDienThoaiBorder }}
                          />
                          {soDienThoaiError && <p className="error-message below-input-error">{soDienThoaiError}</p>}
                        </div>
                        {/* Tên khoa */}
                        <div className="form-group mb-4">
                          <label htmlFor="maKhoa" className="form-label">
                            Tên khoa
                          </label>
                          <select
                              id="maKhoa"
                              name="maKhoa"
                              className="form-control custom-select"
                              value={maKhoa}
                              onChange={handleMaKhoaChange}
                              style={{ borderColor: maKhoaBorder }}
                          >
                            <option value="">Chọn khoa</option>
                            {dsKhoa.map((khoa) => (
                                <option key={khoa.maKhoa} value={khoa.maKhoa}>
                                  {khoa.tenKhoa}
                                </option>
                            ))}
                          </select>
                          {maKhoaError && <p className="error-message below-input-error">{maKhoaError}</p>}
                        </div>
                      </>
                  )}

                  {/* Conditional fields for Nhân viên */}
                  {chucVu === "Nhân viên" && (
                      <>
                        {/* Số điện thoại */}
                        <div className="form-group mb-4">
                          <label htmlFor="soDienThoai" className="form-label">
                            Số điện thoại
                          </label>
                          <input
                              type="text"
                              id="soDienThoai"
                              name="soDienThoai"
                              className="form-control"
                              placeholder="Nhập số điện thoại"
                              value={formData.soDienThoai}
                              onChange={handleInputChange}
                              style={{ borderColor: soDienThoaiBorder }}
                          />
                          {soDienThoaiError && <p className="error-message below-input-error">{soDienThoaiError}</p>}
                        </div>
                        {/* Chức vụ Nhân viên */}
                        <div className="form-group mb-4">
                          <label htmlFor="maCVNV" className="form-label">
                            Chức vụ
                          </label>
                          <select
                              id="maCVNV"
                              name="maCVNV"
                              className="form-control custom-select"
                              value={maCVNV}
                              onChange={handleMaCVNVChange}
                              style={{ borderColor: maCVNVBorder }}
                          >
                            <option value="">Chọn chức vụ</option>
                            {dsChucVuOptions.map((cv) => (
                                <option key={cv.maCV} value={cv.maCV}>
                                  {cv.tenCV}
                                </option>
                            ))}
                          </select>
                          {maCVNVError && <p className="error-message below-input-error">{maCVNVError}</p>}
                        </div>
                      </>
                  )}

                  {/* Avatar Upload */}
                  <div className="form-group mb-4">
                    <input
                        type="file"
                        id="file"
                        style={{ display: "none" }}
                        onChange={handleAvatar}
                    />
                    <label htmlFor="file" className="upload-label">
                      <div className="img-cont">
                        <img
                            src={avatar.url || ava}
                            alt="Avatar"
                            className="user-img"
                        />
                      </div>
                      <span>Upload an image</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="mb-4">
                    <button className="btn btn-primary w-100" disabled={!isFormValid}>
                      Đăng ký
                    </button>
                  </div>
                </form>

                <p className="text-center mb-0">
                  Already have an account? <Link to="/login" className="text-primary">Login here</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}