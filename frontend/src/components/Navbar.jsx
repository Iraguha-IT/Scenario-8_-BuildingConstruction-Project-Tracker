import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    // Get user info stored during login
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="bg-slate-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-10">
                        <div className="text-xl font-bold tracking-wider text-blue-400">
                            CPT-TRACKER
                        </div>
                        <div className="hidden md:flex space-x-4">
                            <NavLink to="/projects" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-blue-400' : 'hover:bg-slate-700'}`}>
                                Projects
                            </NavLink>
                            <NavLink to="/suppliers" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-blue-400' : 'hover:bg-slate-700'}`}>
                                Suppliers
                            </NavLink>
                            <NavLink to="/materials" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-blue-400' : 'hover:bg-slate-700'}`}>
                                Materials
                            </NavLink>
                            <NavLink to="/purchases" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-blue-400' : 'hover:bg-slate-700'}`}>
                                Purchases
                            </NavLink>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-400">Welcome, <span className="text-white font-semibold">{user?.fullName || 'Mugisha'}</span></span>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;