import React from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const handleRestoreAllDashboards = () => {
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach(container => {
            container.style.width = '';
            container.style.height = '';
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <button 
                    className="restore-all-dashboards-button"
                    onClick={handleRestoreAllDashboards}
                >
                    Restaurar tamaño de todos los dashboards
                </button>
            </div>
        </div>
    );
};

export default Dashboard;