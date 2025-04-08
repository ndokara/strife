import { createRoot } from 'react-dom/client';
import '@/assets/scss/index.scss';
import {BrowserRouter, Route, Routes} from "react-router";
import App from './App.tsx';
import Profile from "./components/users/Profile.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<App/>}/>
            <Route path='/profile' element={<Profile/>}/>
            <Route path='/login' element={<LoginPage/>}/>
            <Route path='/register' element={<RegisterPage/>}/>
        </Routes>
    </BrowserRouter>
)
