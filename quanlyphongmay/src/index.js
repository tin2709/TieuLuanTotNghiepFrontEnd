import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './redux/ConfigRedux'; // Import store của bạn

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>  {/* Bọc ứng dụng trong Provider và truyền vào store */}
            <App />
        </Provider>
    </React.StrictMode>
);

// Nếu bạn muốn bắt đầu đo hiệu suất trong ứng dụng, truyền một hàm để ghi kết quả (ví dụ: reportWebVitals(console.log)) hoặc gửi tới một endpoint phân tích.
// Tìm hiểu thêm: https://bit.ly/CRA-vitals
reportWebVitals();
