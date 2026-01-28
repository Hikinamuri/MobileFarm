import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { MainPage } from "./pages/MainPage/MainPage";
import { AuthPage } from "./pages/AuthPage/AuthPage";
import { AuthParams } from "./pages/AuthParams/AuthParams";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AuthPage />} />
                    <Route path="main" element={<MainPage />} />
                    <Route path="auth" element={<AuthPage />} />

                    <Route path="redirect" element={<AuthParams />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
