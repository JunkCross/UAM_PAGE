import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Para hacer solicitudes HTTP
import { FaSearch, FaTrash } from "react-icons/fa";
import NuevoExperimentoModal from '../components/NuevoExperimentoModal.jsx';  // Importamos el componente modal
import { useNavigate } from 'react-router-dom';
import '../styles/Experimentos.css';

const Experimentos = () => {

    const [experimentos, setExperimentos] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);  // Estado para controlar si el modal está abierto

    const [nuevoExperimento, setNuevoExperimento] = useState({
        name: '',
        description: '',
        area: '',
        facility: '',
        location: '',
        concentrator: '',
        sensors: []
    });

    const [areas, setAreas] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [locations, setLocations] = useState([]);
    const [concentrators, setConcentrators] = useState([]);
    const [sensors, setSensors] = useState([]);

    const [areasSeleccionada, setAreasSeleccionada] = useState('');
    const [facilitySeleccionada, setFacilitySeleccionada] = useState('');
    const [locationsSeleccionada, setLocationsSeleccionada] = useState('');
    const [concentratorsSeleccionado, setConcentratorsSeleccionado] = useState('');
    //const [sensors, setSensors] = useState([]);

    const navigate = useNavigate();

    // Obtener experimentos desde la API
    useEffect(() => {
        axios.get('/api/experiments/all')
            .then((response) => {
                console.log('Experimentos:', response.data);
                setExperimentos(response.data);
            })
            .catch((error) => {
                console.error("Hubo un error al obtener los experimentos", error);
            });
        
        // Obtener ubicaciones, concentradores, y sensores
        axios.get('/api/areas')
            .then((response) => setAreas(response.data))
            .catch((error) => console.error("Hubo un error al obtener las áreas", error));
        //axios.get('/api/facilities').then((response) => setFacilities(response.data));
        //axios.get('/api/locations').then((response) => setLocations(response.data));
        //axios.get('/api/concentrators').then((response) => setConcentrators(response.data));
        //axios.get('/api/sensors').then((response) => setSensors(response.data));
    }, []);

    // Obtener facilities según el área seleccionada
    useEffect(() => {
        if (areasSeleccionada) {
            fetch(`/api/facilities/${areasSeleccionada}`)
                .then(response => response.json())
                .then(data => {
                    setFacilities(data);
                    // Limpiar los estados dependientes
                    setFacilitySeleccionada('');
                    setLocationsSeleccionada('');
                    setConcentratorsSeleccionado('');
                    setSensors([]);
                    // Limpiar los campos en el formulario
                    setNuevoExperimento(prev => ({
                        ...prev,
                        facility: '',
                        location: '',
                        concentrator: '',
                        sensors: []
                    }));
                })
                .catch((error) => {
                    console.error("Hubo un error al obtener los facilities", error);
                });
        }
    }, [areasSeleccionada]);

    // Obtener locations según la facility seleccionada
    useEffect(() => {
        if (areasSeleccionada && facilitySeleccionada) {
            fetch(`/api/locations/${areasSeleccionada}/${facilitySeleccionada}`)
                .then(response => response.json())
                .then(data => {
                    setLocations(data);
                    // Limpiar los estados dependientes
                    setLocationsSeleccionada('');
                    setConcentratorsSeleccionado('');
                    setSensors([]);
                    // Limpiar los campos en el formulario
                    setNuevoExperimento(prev => ({
                        ...prev,
                        location: '',
                        concentrator: '',
                        sensors: []
                    }));
                });
        }
    }, [areasSeleccionada, facilitySeleccionada]);

    // Obtener concentradores según la ubicación seleccionada
    useEffect(() => {
        if (locationsSeleccionada) {
            fetch(`/api/concentrators/${locationsSeleccionada}`)
                .then(response => response.json())
                .then(data => {
                    setConcentrators(data);
                    // Limpiar los estados dependientes
                    setConcentratorsSeleccionado('');
                    setSensors([]);
                    // Limpiar los campos en el formulario
                    setNuevoExperimento(prev => ({
                        ...prev,
                        concentrator: '',
                        sensors: []
                    }));
                });
        }  
    }, [locationsSeleccionada]);

    // Obtener sensores según el concentrador seleccionado
    useEffect(() => {
        if (concentratorsSeleccionado) {
            console.log('Obteniendo sensores para concentrador:', concentratorsSeleccionado);
            fetch(`/api/sensors/${concentratorsSeleccionado}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al obtener sensores');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Sensores obtenidos:', data);
                    setSensors(data);
                    // Limpiar los sensores seleccionados en el formulario
                    setNuevoExperimento(prev => ({
                        ...prev,
                        sensors: []
                    }));
                })
                .catch(error => {
                    console.error('Error al obtener sensores:', error);
                });
        } else {
            // Si no hay concentrador seleccionado, limpiar los sensores
            setSensors([]);
        }
    }, [concentratorsSeleccionado]);

    // Función para manejar el filtro de búsqueda
    const handleSearchChange = (e) => {
        setFiltro(e.target.value);
    };

    const handleNuevoExperimento = (e) => {
        setNuevoExperimento({ ...nuevoExperimento, [e.target.name]: e.target.value });
    };
    
    const handleCrearExperimento = async (event) => {
        event.preventDefault();
        try {
            console.log('Datos del formulario:', nuevoExperimento);
            
            // Validar que tengamos los datos necesarios
            if (!nuevoExperimento.name || !nuevoExperimento.description || nuevoExperimento.sensors.length === 0) {
                throw new Error('Faltan campos requeridos');
            }

            const experimentoData = {
                name: nuevoExperimento.name,
                description: nuevoExperimento.description,
                sensors: nuevoExperimento.sensors,
                schema: '1.0.0'
            };

            console.log('Datos a enviar a la API:', experimentoData);

            const response = await fetch('/api/experiments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(experimentoData)
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Error al crear experimento');
            }

            console.log('Respuesta de la API:', responseData);
            
            // Actualizar la lista de experimentos
            const updatedExperimentos = await axios.get('/api/experiments/all');
            setExperimentos(updatedExperimentos.data);
            
            // Limpiar el formulario y cerrar el modal
            setNuevoExperimento({
                name: '',
                description: '',
                area: '',
                facility: '',
                location: '',
                concentrator: '',
                sensors: []
            });
            setIsModalOpen(false);
            
        } catch (error) {
            console.error('Error al crear experimento:', error);
            alert('Error al crear el experimento: ' + error.message);
        }
    };

    // Filtrar experimentos según el texto de búsqueda
    const experimentosFiltrados = experimentos.filter((exp) => 
        exp.name.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleExperimentoClick = (experimentoId) => {
        navigate(`/experimentos/${experimentoId}`);
    };

    const handleDeleteExperiment = async (experimentId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este experimento?')) {
            try {
                const response = await fetch(`/api/experiments/${experimentId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    // Actualizar la lista de experimentos
                    const updatedExperimentos = experimentos.filter(
                        exp => exp._id !== experimentId
                    );
                    setExperimentos(updatedExperimentos);
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error al eliminar el experimento');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al eliminar el experimento');
            }
        }
    };

    return (
        <div className="experimentos-container">
            {/* Botón "Nuevo experimento" */}
            <div className="header">
        <button className="nuevo-experimento-btn" onClick={() => setIsModalOpen(true)}>Nuevo experimento</button>
      </div>
            
            {/* Buscador con ícono de lupa */}
            <div className="search-container">
                <i className="fa fa-search search-icon"></i> {<FaSearch />}
                <input
                    type="text"
                    placeholder="Buscar experimento"
                    value={filtro}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                
            </div>

            {/* Mostrar experimentos */}
            <div className="experimentos-list">
                {experimentosFiltrados.map((exp) => (
                    <div 
                        key={exp._id} 
                        className="experimento-item"
                        onClick={() => handleExperimentoClick(exp._id)}
                    >
                        <div className="experimento-header">
                            <h3>{exp.name}</h3>
                            <button 
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExperiment(exp._id);
                                }}
                                title="Eliminar experimento"
                            >
                                <FaTrash />
                            </button>
                        </div>
                        
                        <div className="experimento-content">
                            <div className="experimento-description">
                                <p><strong>Descripción:</strong> {exp.description}</p>
                            </div>
                            
                            <div className="experimento-info">
                                <p><strong>Fecha de inicio:</strong> {new Date(exp.start_timestamp).toLocaleString('es-ES', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}</p>
                                <p><strong>Fecha de terminación:</strong> {new Date(exp.end_timestamp).toLocaleString('es-ES', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}</p>
                                <p><strong>Sensores:</strong></p>
                                <ul className="sensors-list">
                                    {exp.sensors.map(sensor => (
                                        <li key={sensor.id}>
                                            {sensor.type} 
                                            {sensor.description && ` - ${sensor.description}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
      
            {isModalOpen && (
                <NuevoExperimentoModal
                    nuevoExperimento={nuevoExperimento}
                    handleNuevoExperimento={handleNuevoExperimento}
                    areas={areas}
                    facilities={facilities}
                    locations={locations}
                    concentrators={concentrators}
                    sensors={sensors}

                    areasSeleccionada={areasSeleccionada}
                    setAreasSeleccionada={setAreasSeleccionada}
                    facilitySeleccionada={facilitySeleccionada}
                    setFacilitySeleccionada={setFacilitySeleccionada}
                    locationsSeleccionada={locationsSeleccionada}
                    setLocationsSeleccionada={setLocationsSeleccionada}
                    concentratorsSeleccionado={concentratorsSeleccionado}
                    setConcentratorsSeleccionado={setConcentratorsSeleccionado}


                    handleCrearExperimento={handleCrearExperimento}
                    closeModal={() => setIsModalOpen(false)}  // Función para cerrar el modal
                />
            )}

        </div>
       
    );
};

export default Experimentos;