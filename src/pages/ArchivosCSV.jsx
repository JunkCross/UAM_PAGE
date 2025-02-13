import React, { useState, useEffect } from 'react';
import '../styles/ArchivosCSV.css';

const ArchivosCSV = () => {
    const [archivos, setArchivos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArchivos();
    }, []);

    const fetchArchivos = async () => {
        try {
            const response = await fetch('/api/csv-files');
            const data = await response.json();
            setArchivos(data);
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener archivos:', error);
            setLoading(false);
        }
    };

    const handleDownload = async (fileId) => {
        try {
            const response = await fetch(`/api/csv-files/${fileId}/download`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = archivos.find(a => a.id === fileId).filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar archivo:', error);
        }
    };

    const handleDelete = async (fileId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
            try {
                const response = await fetch(`/api/csv-files/${fileId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Actualizar la lista de archivos
                    setArchivos(archivos.filter(archivo => archivo.id !== fileId));
                } else {
                    throw new Error('Error al eliminar el archivo');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al eliminar el archivo');
            }
        }
    };

    const filteredArchivos = archivos.filter(archivo =>
        archivo.experiment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        archivo.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="archivos-csv-container">
            <h1>Archivos CSV de Experimentos</h1>
            
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre de experimento o archivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading">Cargando archivos...</div>
            ) : (
                <table className="archivos-table">
                    <thead>
                        <tr>
                            <th>Experimento</th>
                            <th>Archivo</th>
                            <th>Fecha de creación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArchivos.map(archivo => (
                            <tr key={archivo.id}>
                                <td>{archivo.experiment_name}</td>
                                <td>{archivo.filename}</td>
                                <td>{new Date(archivo.created_at).toLocaleString()}</td>
                                <td className="actions-column">
                                    <button
                                        className="download-button"
                                        onClick={() => handleDownload(archivo.id)}
                                    >
                                        Descargar
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(archivo.id)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ArchivosCSV;