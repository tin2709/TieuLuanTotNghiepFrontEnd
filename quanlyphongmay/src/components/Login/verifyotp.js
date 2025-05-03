import { useState, useRef, useEffect } from "react"; // Import useRef and useEffect
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import "./style.css"; // Ensure your CSS file is correctly linked

const OTP_LENGTH = 6; // Define OTP length constant

export default function VerifyOtp() {
    const [email, setEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill("")); // State for individual digits
    const [otp, setOtp] = useState(""); // Still need the combined OTP string for submission
    const navigate = useNavigate();
    const inputRefs = useRef([]); // Ref to hold input elements

    // Effect to update the combined OTP string whenever otpDigits changes
    useEffect(() => {
        const combinedOtp = otpDigits.join("");
        setOtp(combinedOtp);
        // Optional: Trigger validation or submission if all digits are filled
        // if (combinedOtp.length === OTP_LENGTH) {
        //   console.log("OTP complete:", combinedOtp);
        // }
    }, [otpDigits]);

    // Handle changes in OTP input boxes
    const handleOtpChange = (e, index) => {
        const value = e.target.value;

        // Allow only digits and only one character
        if (/^[0-9]$/.test(value) || value === "") {
            const newOtpDigits = [...otpDigits];
            newOtpDigits[index] = value;
            setOtpDigits(newOtpDigits);


            // Move focus to the next input if a digit was entered
            if (value !== "" && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (value.length > 1) {
            // Handle paste or multiple character input (take only the first valid digit)
            const firstValidDigit = value.split('').find(char => /^[0-9]$/.test(char));
            if (firstValidDigit) {
                const newOtpDigits = [...otpDigits];
                newOtpDigits[index] = firstValidDigit;
                setOtpDigits(newOtpDigits);
                if (index < OTP_LENGTH - 1) {
                    inputRefs.current[index + 1]?.focus();
                }
            }
        }
    };

    // Handle Backspace and Arrow Keys
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            // If current input is empty and we press backspace, move focus to previous input
            if (otpDigits[index] === "" && index > 0) {
                e.preventDefault(); // Prevent default backspace behavior
                inputRefs.current[index - 1]?.focus();
                // Optionally clear the previous input as well if desired
                // const newOtpDigits = [...otpDigits];
                // newOtpDigits[index - 1] = "";
                // setOtpDigits(newOtpDigits);
            }
            // Normal backspace behavior will clear the current input,
            // onChange will handle the state update
        } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle pasting OTP
    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData?.getData("text").trim();
        // Allow only digits in pasted data
        if (pasteData && /^[0-9]+$/.test(pasteData)) {
            const digits = pasteData.split('').slice(0, OTP_LENGTH);
            const newOtpDigits = [...otpDigits]; // Start with current digits
            digits.forEach((digit, i) => {
                // Paste starting from the currently focused input (or first if none focused)
                // For simplicity, let's always paste starting from the first box for now.
                if (i < OTP_LENGTH) {
                    newOtpDigits[i] = digit;
                }
            });
            setOtpDigits(newOtpDigits);

            // Focus the next empty input or the last input
            const nextEmptyIndex = newOtpDigits.findIndex(d => d === "");
            const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : OTP_LENGTH - 1;
            inputRefs.current[focusIndex]?.focus();
        }
    };


    // Handle form submission for verifying OTP (uses the combined 'otp' state)
    const handleSubmitVerifyOtp = async (e) => {
        e.preventDefault();

        // Now check the combined 'otp' state which is updated by the useEffect
        if (!email || otp.length !== OTP_LENGTH) { // Check if all 6 digits are filled
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: `Vui lòng nhập email và đủ ${OTP_LENGTH} chữ số OTP!`,
            });
        } else {
            try {
                const formData = new FormData();
                formData.append("email", email);
                formData.append("otp", otp); // Send the combined OTP string

                const response = await fetch("https://localhost:8080/verify_otp_forgot_password", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "OTP hợp lệ!",
                        text: "Mã OTP hợp lệ. Bạn có thể thay đổi mật khẩu.",
                    }).then(() => {
                        navigate("/updatepass");
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Lỗi",
                        text: "Mã OTP không hợp lệ hoặc hết hạn. Vui lòng thử lại.",
                    });
                    // Optionally clear OTP fields on error
                    setOtpDigits(Array(OTP_LENGTH).fill(""));
                    inputRefs.current[0]?.focus(); // Focus the first input again
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối với máy chủ. Vui lòng thử lại sau.",
                });
                console.error(error);
            }
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
                            <h3 className="text-center fw-bold mb-5 text-black">Xác nhận OTP</h3>
                            <form onSubmit={handleSubmitVerifyOtp}>
                                {/* Email Input (Remains the same) */}
                                <div className="form-group mb-4">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-control"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required // Added required for basic validation
                                    />
                                </div>

                                {/* OTP Input - Replaced with individual boxes */}
                                <div className="form-group mb-4">
                                    <label htmlFor="otp-0" className="form-label">Mã OTP</label> {/* Point label to first input */}
                                    <div className="otp-input-container" onPaste={handlePaste}> {/* Container for OTP boxes */}
                                        {otpDigits.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`} // Unique ID for each input
                                                ref={(el) => (inputRefs.current[index] = el)} // Assign ref
                                                type="tel" // Use tel for better mobile numeric keyboard
                                                inputMode="numeric" // Hint for numeric keyboard
                                                pattern="[0-9]" // Pattern for single digit
                                                maxLength="1"
                                                className="otp-input" // Specific class for styling
                                                value={digit}
                                                onChange={(e) => handleOtpChange(e, index)}
                                                onKeyDown={(e) => handleKeyDown(e, index)}
                                                // required // Individual inputs don't strictly need required if form validation checks length
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button (Remains the same) */}
                                <div className="mb-4">
                                    <button type="submit" className="btn btn-primary w-100">
                                        Xác nhận OTP
                                    </button>
                                </div>
                            </form>

                            <p className="text-center mb-0">
                                Quay lại{" "}
                                <Link to="/forgotpass" className="text-primary">
                                    Quên mật khẩu
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}