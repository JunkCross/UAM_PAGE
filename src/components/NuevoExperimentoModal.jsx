// NuevoExperimentoModal.jsx
import React, { useState } from 'react';
import '../styles/Modal.css';

const NuevoExperimentoModal = ({
  nuevoExperimento,
  handleNuevoExperimento,
  areas,
  facilities,
  locations,
  concentrators,
  sensors,

  areasSeleccionada,
  setAreasSeleccionada,
  facilitySeleccionada,
  setFacilitySeleccionada,
  locationsSeleccionada,
  setLocationsSeleccionada,
  concentratorsSeleccionado,
  setConcentratorsSeleccionado,
  handleCrearExperimento,
  closeModal
}) => {

  // Estado para manejar los errores de validación
  const [errores, setErrores] = useState({});

  // Función para validar los campos del formulario
  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!nuevoExperimento.name.trim()) {
      nuevosErrores.name = 'El título es obligatorio';
    }
    if (!nuevoExperimento.description.trim()) {
      nuevosErrores.description = 'La descripción es obligatoria';
    }
    if (!nuevoExperimento.area) {
      nuevosErrores.area = 'Debe seleccionar un área';
    }
    if (!nuevoExperimento.facility) {
      nuevosErrores.facility = 'Debe seleccionar una instalación';
    }
    if (!nuevoExperimento.location) {
      nuevosErrores.location = 'Debe seleccionar una ubicación';
    }
    if (!nuevoExperimento.concentrator) {
      nuevosErrores.concentrator = 'Debe seleccionar un concentrador';
    }
    if (nuevoExperimento.sensors.length === 0) {
      nuevosErrores.sensors = 'Debe seleccionar al menos un sensor';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;  // Si no hay errores, el formulario es válido
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (event) => {
    event.preventDefault();
    if (validarFormulario()) {
      handleCrearExperimento(event);  // Solo enviar si la validación es correcta
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear experimento</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Título:
            <input
              type="text"
              name="name"
              value={nuevoExperimento.name}
              onChange={handleNuevoExperimento}
              placeholder="Nombre del experimento"
            />
            {errores.name && <p className="error">{errores.name}</p>} {/* Mostrar error si existe */}
          </label>
          <label>
            Descripción:
            <textarea
              name="description"
              value={nuevoExperimento.description}
              onChange={handleNuevoExperimento}
              placeholder="Descripción"
            />
            {errores.description && <p className="error">{errores.description}</p>}
          </label>
          <label>
            Areá:
            <select
              name="area"
              value={nuevoExperimento.area}
              onChange={(e) => {
                handleNuevoExperimento(e);
                setAreasSeleccionada(e.target.value);
              }}
            >
              <option value="">Seleccione una ubicación</option>
              {areas && areas.length > 0 ? (
                areas.map((area) => (
                  <option key={area._id} value={area._id}>
                    {area.area} - {area.description}
                  </option>
                ))
              ) : (
                <option value="">No hay áreas disponibles</option>
              )}
            </select>
            {errores.area && <p className="error">{errores.area}</p>}
          </label>

          <label>
            Facilities:
            <select
              name="facility"
              value={nuevoExperimento.facility}
              onChange={(e) => {
                handleNuevoExperimento(e);
                setFacilitySeleccionada(e.target.value);
              }}
            >
              <option value="">Seleccione un facility</option>
              {facilities && facilities.length > 0 ? (
                facilities.map((facility) => (
                  <option key={facility._id} value={facility._id}>
                    {facility.name} - {facility.description}
                  </option>
                ))
              ) : (
                <option value="">No hay facilities disponibles</option>
              )}
            </select>
            {errores.facility && <p className="error">{errores.facility}</p>}
          </label>

          <label>
            Locations:
            <select
              name="location"
              value={nuevoExperimento.location}
              onChange={(e) => {
                handleNuevoExperimento(e);
                setLocationsSeleccionada(e.target.value);
              }}
            >
              <option value="">Seleccione una location</option>
              {console.log('Locations:', locations)}
              {console.log('Area seleccionada:', areasSeleccionada)}
              {console.log('Facility seleccionada:', facilitySeleccionada)}
              {locations && locations.length > 0 && (
                locations
                  .filter((location) => {
                    // Eliminamos la validación de área y facility temporalmente
                    // para ver si hay locations disponibles
                    return true;
                  })
                  .map((location) => {
                    console.log('Renderizando location:', location);
                    return (
                      <option key={location._id} value={location._id}>
                        {location.name} - {location.description}
                      </option>
                    );
                  })
              )}
            </select>
            {errores.location && <p className="error">{errores.location}</p>}
          </label>

          <label>
            Concentrators:
            <select
              name="concentrator"
              value={nuevoExperimento.concentrator}
              onChange={(e) => {
                handleNuevoExperimento(e);
                setConcentratorsSeleccionado(e.target.value);
              }}
            >
              <option value="">Seleccione un concentrador</option>
              {concentrators && concentrators.length > 0 ? (
                concentrators.map((concentrator) => (
                  <option key={concentrator._id} value={concentrator._id}>
                    {concentrator.board} - {concentrator.description}
                  </option>
                ))
              ) : (
                <option value="">No hay concentradores disponibles</option>
              )}
            </select>
            {errores.concentrator && <p className="error">{errores.concentrator}</p>}
          </label>

          <label>
            Sensores:
            <select
              multiple
              name="sensors"
              value={nuevoExperimento.sensors}
              onChange={(e) => {
                const sensoresSeleccionados = Array.from(e.target.selectedOptions, (option) => option.value);
                console.log('Sensores seleccionados:', sensoresSeleccionados);
                handleNuevoExperimento({ 
                  target: { 
                    name: 'sensors', 
                    value: sensoresSeleccionados 
                  } 
                });
              }}
            >
              {sensors && sensors.length > 0 ? (
                sensors.map((sensor) => (
                  <option key={sensor._id} value={sensor._id}>
                    {sensor.type} - {sensor.description || 'Sin descripción'}
                  </option>
                ))
              ) : (
                <option value="">No hay sensores disponibles</option>
              )}
            </select>
            {errores.sensors && <p className="error">{errores.sensors}</p>}
          </label>
          <div className="Buton">
            <button type="submit">Crear experimento</button>
            <button type="button" onClick={closeModal}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoExperimentoModal;

