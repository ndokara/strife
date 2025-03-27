// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/scss/index.scss';
import {BrowserRouter, Route, Routes} from "react-router";
import App from './App.tsx';
import {Login} from "./components/auth/Login.tsx";
import {Profile} from "./components/users/Profile.tsx";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<App/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/profile' element={<Profile/>}/>
        </Routes>
    </BrowserRouter>
)
