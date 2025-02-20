import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import ReactApexChart from 'react-apexcharts';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import io from 'socket.io-client';
import '../styles/Dashboard.css';
//import line from 'react-chartjs/lib/line';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ExperimentoDashboard = () => {
    const { id } = useParams();
    const [experimento, setExperimento] = useState(null);
    const [sensorData, setSensorData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [positions, setPositions] = useState({});
    const [resizeTimeout, setResizeTimeout] = useState(null);
    const socketRef = useRef();
    const MAX_DATA_POINTS = 50; // Número máximo de puntos a mostrar
    //const [maxDataPoints, setMaxDataPoints] = useState(50);
    const [isSampling, setIsSampling] = useState(false);
    const [samplingStartTime, setSamplingStartTime] = useState(null);
    const [samplingEndTime, setSamplingEndTime] = useState(null);
    const [downloadReady, setDownloadReady] = useState(false);

    const getGaugeOptions = (value, maxValue) => ({
        chart: {
            height: 200,
            type: 'radialBar',
            background: 'transparent'
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 0,
                    size: '70%',
                    background: 'transparent'
                },
                track: {
                    background: 'rgba(231, 231, 231, 0.3)',
                    strokeWidth: '97%',
                    margin: 5,
                    dropShadow: {
                        enabled: false
                    }
                },
                dataLabels: {
                    show: true,
                    name: {
                        show: false,
                    },
                    value: {
                        fontSize: '30px',
                        show: true,
                        formatter: function(val) {
                            return value.toFixed(1);
                        },
                        color: '#2c3e50'
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#ABE5A1'],
                inverseColors: true,
                opacityFrom: 0.8,
                opacityTo: 0.8,
                stops: [0, 100]
            }
        },
        series: [(value / maxValue) * 100],
        labels: ['Value'],
        states: {
            normal: {
                filter: {
                    type: 'none'
                }
            },
            hover: {
                filter: {
                    type: 'none'
                }
            },
            active: {
                filter: {
                    type: 'none'
                }
            }
        }
    });

    useEffect(() => {
        const fetchExperimentoData = async () => {
            try {
                const response = await fetch(`/api/experiments/${id}`);
                const data = await response.json();
                console.log('Datos del experimento:', data);
                setExperimento(data);
            } catch (error) {
                console.error('Error al obtener datos del experimento:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperimentoData();
    }, [id]);

    useEffect(() => {
        const connectSocket = () => {
            socketRef.current = io('http://192.168.0.39:5000');

            socketRef.current.on('connect', () => {
                console.log('Conectado al servidor Socket.IO');
                socketRef.current.emit('subscribe_experiment', id);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Error de conexión:', error);
            });

            socketRef.current.on(`experiment_data_${id}`, (data) => {
                setSensorData(prevData => {
                    const updatedData = { ...prevData };
                    
                    data.forEach(measurement => {
                        const sensorId = measurement.sensor_id;
                        const metrics = measurement.metrics;
                        
                        if (!updatedData[sensorId]) {
                            updatedData[sensorId] = {};
                        }

                        Object.entries(metrics).forEach(([metricType, metricData]) => {
                            if (!updatedData[sensorId][metricType]) {
                                updatedData[sensorId][metricType] = [];
                            }

                            // Verificar si la medición ya existe
                            const exists = updatedData[sensorId][metricType].some(
                                m => m.timestamp === measurement.timestamp
                            );

                            if (!exists) {
                                // Agregar nueva medición
                                updatedData[sensorId][metricType].push({
                                    timestamp: measurement.timestamp,
                                    value: metricData.value,
                                    unit: metricData.unit
                                });

                                // Ordenar por timestamp y mantener solo los últimos maxDataPoints
                                updatedData[sensorId][metricType].sort(
                                    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                                );

                                if (updatedData[sensorId][metricType].length > MAX_DATA_POINTS) {
                                    updatedData[sensorId][metricType] = 
                                        updatedData[sensorId][metricType].slice(-MAX_DATA_POINTS);
                                }
                            }
                        });
                    });

                    return updatedData;
                });
            });
        };

        connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('unsubscribe_experiment', id);
                console.log('Desuscrito del experimento:', id);
                socketRef.current.disconnect();
            }
        };
    }, [id]);

    // Verificar estado de muestreo al cargar
    useEffect(() => {
        const checkSamplingStatus = async () => {
            try {
                const response = await fetch(`/api/experiments/${id}/status`);
                const data = await response.json();
                
                if (data.is_sampling) {
                    setIsSampling(true);
                    setSamplingStartTime(data.start_timestamp);
                    setSamplingEndTime(null);
                }
            } catch (error) {
                console.error('Error al verificar estado de muestreo:', error);
            }
        };

        checkSamplingStatus();
    }, [id]);

    const handleRestoreAllSizes = () => {
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach(container => {
            container.style.width = '';
            container.style.height = '';
        });
    };

    useEffect(() => {
        const handleFullScreenChange = () => {
            const isFullScreenNow = document.fullscreenElement !== null;
            setIsFullScreen(isFullScreenNow);
            
            // Restaurar tamaños cuando se sale de pantalla completa
            if (!isFullScreenNow) {
                handleRestoreAllSizes();
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    const toggleFullScreen = async () => {
        const chartsGrid = document.querySelector('.charts-grid');
        
        if (!document.fullscreenElement) {
            try {
                await chartsGrid.requestFullscreen();
            } catch (err) {
                console.error('Error al intentar mostrar pantalla completa:', err);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleResize = (container) => {
        const rect = container.getBoundingClientRect();
        const containers = document.querySelectorAll('.chart-container');
        const gridGap = 20; // El gap entre contenedores
        
        container.style.zIndex = '1000';
        
        containers.forEach(otherContainer => {
            if (otherContainer !== container) {
                const otherRect = otherContainer.getBoundingClientRect();
                
                // Detectar colisión
                if (!(rect.right < otherRect.left - gridGap || 
                    rect.left > otherRect.right + gridGap || 
                    rect.bottom < otherRect.top - gridGap || 
                    rect.top > otherRect.bottom + gridGap)) {
                    
                    // Calcular la dirección de la colisión
                    const overlapX = Math.min(rect.right - otherRect.left, otherRect.right - rect.left);
                    const overlapY = Math.min(rect.bottom - otherRect.top, otherRect.bottom - rect.top);
                    
                    if (overlapX < overlapY) {
                        // Colisión horizontal
                        const pushDistance = rect.width + gridGap;
                        
                        if (rect.left < otherRect.left) {
                            // Empujar todos los contenedores a la derecha
                            const affectedContainers = Array.from(containers).filter(c => {
                                const cRect = c.getBoundingClientRect();
                                return c !== container && cRect.left >= rect.right;
                            });
                            
                            affectedContainers.forEach(c => {
                                c.style.transform = `translateX(${pushDistance}px)`;
                                c.style.zIndex = '1';
                            });
                        } else {
                            // Empujar todos los contenedores a la izquierda
                            const affectedContainers = Array.from(containers).filter(c => {
                                const cRect = c.getBoundingClientRect();
                                return c !== container && cRect.right <= rect.left;
                            });
                            
                            affectedContainers.forEach(c => {
                                c.style.transform = `translateX(-${pushDistance}px)`;
                                c.style.zIndex = '1';
                            });
                        }
                    }
                }
            }
        });
    };

    useEffect(() => {
        let observer;
        if (isFullScreen) {
            observer = new ResizeObserver((entries) => {
                // Cancelar el timeout anterior si existe
                if (resizeTimeout) {
                    window.cancelAnimationFrame(resizeTimeout);
                }

                // Crear nuevo timeout usando requestAnimationFrame
                const timeout = window.requestAnimationFrame(() => {
                    entries.forEach(entry => {
                        const container = entry.target;
                        container.classList.add('resizing');
                        handleResize(container);
                        
                        setTimeout(() => {
                            document.querySelectorAll('.chart-container').forEach(cont => {
                                cont.style.transition = 'transform 0.3s, z-index 0s';
                                cont.style.transform = '';
                                cont.style.zIndex = '1';
                            });
                            container.classList.remove('resizing');
                        }, 100);
                    });
                });

                setResizeTimeout(timeout);
            });

            const containers = document.querySelectorAll('.chart-container');
            containers.forEach(container => {
                observer.observe(container);
                
                // Inicializar posiciones
                const rect = container.getBoundingClientRect();
                setPositions(prev => ({
                    ...prev,
                    [container.dataset.id]: { x: rect.left, y: rect.top }
                }));
            });
        }

        return () => {
            if (observer) {
                observer.disconnect();
            }
            if (resizeTimeout) {
                window.cancelAnimationFrame(resizeTimeout);
            }
        };
    }, [isFullScreen]);

    const handleResetSize = (e) => {
        const container = e.currentTarget.closest('.chart-container');
        if (container) {
            container.style.width = '';
            container.style.height = '';
        }
    };

    // Función auxiliar para formatear la hora local
    const formatLocalTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const handleStartSampling = async () => {
        const currentTime = new Date().toISOString();
        try {
            const response = await fetch(`/api/experiments/${id}/update-timestamp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_timestamp: currentTime,
                    is_sampling: true
                })
            });

            if (response.ok) {
                setIsSampling(true);
                setSamplingStartTime(currentTime);
                setSamplingEndTime(null);
                setDownloadReady(false);
                localStorage.setItem(`experiment_${id}_sampling`, 'true');
                localStorage.setItem(`experiment_${id}_start_time`, currentTime);
            }
        } catch (error) {
            console.error('Error al iniciar muestreo:', error);
        }
    };

    const handleStopSampling = async () => {
        const currentTime = new Date().toISOString();
        try {
            const response = await fetch(`/api/experiments/${id}/update-timestamp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    end_timestamp: currentTime,
                    is_sampling: false
                })
            });

            if (response.ok) {
                setIsSampling(false);
                setSamplingEndTime(currentTime);
                setDownloadReady(true);
                localStorage.removeItem(`experiment_${id}_sampling`);
                localStorage.removeItem(`experiment_${id}_start_time`);

                // Generar y guardar el CSV automáticamente
                try {
                    await fetch(`/api/experiments/${id}/download-csv`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            start_timestamp: samplingStartTime,
                            end_timestamp: currentTime,
                            experiment_name: experimento.name,
                            auto_save: true
                        })
                    });
                } catch (error) {
                    console.error('Error al guardar CSV automáticamente:', error);
                }
            }
        } catch (error) {
            console.error('Error al detener muestreo:', error);
        }
    };

    const handleDownloadCSV = async () => {
        if (!samplingStartTime || !samplingEndTime) return;

        try {
            const response = await fetch(`/api/experiments/${id}/download-csv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_timestamp: samplingStartTime,
                    end_timestamp: samplingEndTime,
                    experiment_name: experimento.name
                })
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${experimento.name}_${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar CSV:', error);
        }
    };

    if (loading) return (
        <div className="dashboard-container">
            <div className="loading-state">
                Cargando datos del experimento...
            </div>
        </div>
    );

    if (!experimento) return (
        <div className="dashboard-container">
            <div className="error-message">
                No se encontró el experimento solicitado
            </div>
        </div>
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point: {
                radius: 1,
                hitRadius: 10
            },
            line: {
                tension: 0.4,
                borderWidth: 2,
                borderJoinStyle: 'round'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    maxTicksLimit: 5
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 6,
                    maxRotation: 0,
                    autoSkip: true
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        },
        animation: {
            duration: 0,
            easing: 'linear'
        },
        interaction: {
            intersect: false,
            mode: 'nearest'
        }
    };

    return (
        <div className="dashboard-container">
            <div className={`dashboard-content ${isFullScreen ? 'hidden' : ''}`}>
                <h1>{experimento.name}</h1>
                <p>{experimento.description}</p>
                
                <div className="time-controls">
                    <button
                        className={`sampling-button start ${isSampling ? 'disabled' : ''}`}
                        onClick={handleStartSampling}
                        disabled={isSampling}
                    >
                        Iniciar muestreo
                    </button>
                    <button
                        className={`sampling-button stop ${!isSampling ? 'disabled' : ''}`}
                        onClick={handleStopSampling}
                        disabled={!isSampling}
                    >
                        Detener muestreo
                    </button>
                    <div className={`sampling-indicator ${isSampling ? 'active' : ''}`} />
                    {downloadReady && (
                        <button
                            className="download-button"
                            onClick={handleDownloadCSV}
                        >
                            Descargar CSV
                        </button>
                    )}
                    <button 
                        className="fullscreen-button"
                        onClick={toggleFullScreen}
                    >
                        {isFullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                    </button>
                </div>
            </div>
            
            <div className={`charts-grid ${isFullScreen ? 'fullscreen' : ''}`}>
                {isFullScreen && (
                    <div className="restore-all-container">
                        <button 
                            className="restore-all-button"
                            onClick={handleRestoreAllSizes}
                        >
                            Restaurar todos los tamaños
                        </button>
                    </div>
                )}
                
                {experimento?.sensors?.map(sensor => {
                    console.log('Renderizando sensor:', sensor);
                    console.log('ID del sensor:', sensor.id);
                    console.log('Datos disponibles:', sensorData);
                    
                    const sensorMetrics = sensorData[sensor.id] || {};
                    console.log('Métricas del sensor:', sensorMetrics);
                    
                    return Object.entries(sensorMetrics).map(([metricType, measurements]) => {
                        console.log(`Procesando métrica ${metricType}:`, measurements);
                        
                        const lastValue = measurements[measurements.length - 1]?.value || 0;
                        const maxValue = Math.max(...measurements.map(d => d.value) || [100]);
                        const unit = measurements[0]?.unit || '';
                        
                        return (
                            <div 
                                key={`${sensor.id}-${metricType}`}
                                className={`chart-container ${isResizing ? 'resizing' : ''}`}
                                data-id={sensor.id}
                            >
                                <div className="chart-controls">
                                    <button 
                                        className="reset-size"
                                        onClick={(e) => {
                                            e.currentTarget.parentElement.parentElement.style.width = '';
                                            e.currentTarget.parentElement.parentElement.style.height = '';
                                        }}
                                    >
                                        Restaurar tamaño
                                    </button>
                                </div>
                                
                                <h3>{sensor.name} - {metricType}</h3>
                                
                                <div className="sensor-data-container">
                                    <div className="current-value">
                                        <span className="value">{lastValue.toFixed(1)}</span>
                                        <span className="unit">{unit}</span>
                                    </div>
                                    
                                    <div className="chart-wrapper">
                                        <Line
                                            data={{
                                                labels: measurements.map(d => formatLocalTime(d.timestamp)),
                                                datasets: [{
                                                    label: metricType,
                                                    data: measurements.map(d => d.value),
                                                    borderColor: '#3498db',
                                                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                                    borderWidth: 2,
                                                    tension: 0.4,
                                                    fill: true,
                                                    cubicInterpolationMode: 'monotone',
                                                    spanGaps: true
                                                }]
                                            }}
                                            options={chartOptions}
                                        />
                                    </div>
                                    
                                    <div className="gauge-wrapper">
                                        <ReactApexChart
                                            options={getGaugeOptions(lastValue, maxValue)}
                                            series={[(lastValue / maxValue) * 100]}
                                            type="radialBar"
                                            height={200}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default ExperimentoDashboard; 