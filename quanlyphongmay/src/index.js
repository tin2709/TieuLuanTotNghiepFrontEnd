// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
// SỬA LỖI IMPORT: Import store dưới dạng default import
import store from './redux/store'; // Giả sử store.js export default store
import ReactGA from "react-ga4";
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../src/components/i18n/i18n'; // Import the i18n configuration

ReactGA.initialize("G-E9T4ZC6VKP");

ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* SỬA LỖI IMPORT: Truyền store đã import đúng */}
        <Provider store={store}>
            <GoogleOAuthProvider clientId="25503328823-80ck8k2dpchg36qs1beleuj5s1clqukh.apps.googleusercontent.com">
                <App />
            </GoogleOAuthProvider>
        </Provider>
    </React.StrictMode>
);

reportWebVitals();