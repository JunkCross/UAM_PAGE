import React, { useState } from 'react';
import {
    FaMicrochip, FaBars, FaTh, FaTachometerAlt, FaFileExport, FaFileCsv
}from "react-icons/fa";
import { NavLink } from 'react-router-dom';

const Sidebar = ({children}) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen (!isOpen)
    const menuItem=[
        {
            path:"/",
            name:"Experimentos",
            icon: <FaTh />
        },
        {
            path:"/reportes",
            name:"Reportes",
            icon:<FaFileExport />
        },
        {
            path:"/archivosCSV",
            name:"ArchivosCSV",
            icon:<FaFileCsv />
        }
    ]
    return (
        <div className="container">
            <div style={{width: isOpen ? "360px" : "65px"}} className="sidebar">
                <div className="top_seccion">
                    <h1 style={{display: isOpen ? "flex" : "none"}} className='logo'><FaMicrochip style={{ gap: '65px' }}/>Datos</h1>
                    <div style={{marginLeft: isOpen ? "30px" : "0px"}} className="bars">
                        <FaBars onClick={toggle}/>
                    </div>
                </div>
                {
                    menuItem.map((item, index) => (
                        <NavLink to={item.path} key={index} className="link" activeClassName="active">
                            <div className="icon">{item.icon}</div>
                            <div className='link_text'>{item.name}</div>
                        </NavLink>
                    ))
                }
            </div>
            <main>{children}</main>
        </div>
    );
}

export default Sidebar