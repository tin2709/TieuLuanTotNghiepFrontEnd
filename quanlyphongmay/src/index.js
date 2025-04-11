import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './redux/ConfigRedux'; // Import store của bạn
import ReactGA from "react-ga4";
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactGA.initialize("G-E9T4ZC6VKP");

ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>  {/* Bọc ứng dụng trong Provider và truyền vào store */}
            {/* Bọc App component với GoogleOAuthProvider và cung cấp client ID */}
            <GoogleOAuthProvider clientId="25503328823-80ck8k2dpchg36qs1beleuj5s1clqukh.apps.googleusercontent.com">
                <App />
            </GoogleOAuthProvider>
        </Provider>
    </React.StrictMode>
);

// Nếu bạn muốn bắt đầu đo hiệu suất trong ứng dụng, truyền một hàm để ghi kết quả (ví dụ: reportWebVitals(console.log)) hoặc gửi tới một endpoint phân tích.
// Tìm hiểu thêm: https://bit.ly/CRA-vitals
reportWebVitals();