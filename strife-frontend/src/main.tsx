import { createRoot } from 'react-dom/client';
import '@/assets/scss/index.scss';
import { BrowserRouter, Route, Routes } from "react-router";
import App from './App.tsx';
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import DashboardPage from "@/pages/DashboardPage.tsx";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<App/>}/>
            <Route path='/login' element={<LoginPage/>}/>
            <Route path='/register' element={<RegisterPage/>}/>
            <Route path="/dashboard/*" element={<DashboardPage/>}/>
        </Routes>
    </BrowserRouter>
)
