from flask import Flask, jsonify, request, send_file
from grafana_api.model import APIModel
from grafana_api.dashboard import Dashboard
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
import json
import time
import logging
from bson import ObjectId
import csv
import io
import os
import pytz  # Agregar esta importación

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Conexión a MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['base_test']

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtener areas disponibles
@app.route('/api/areas', methods=['GET'])
def get_areas():
    areas = db.areas.find()
    print(areas)  # Imprimir los resultados
    return jsonify([{'_id': str(area['_id']), 'name': area['name'], 'description': area['description']} for area in areas])


@app.route('/api/facilities/<area_id>', methods=['GET'])
def get_facilities(area_id):
    # Obtener el área seleccionada desde los parámetros de la solicitud
    
    if not area_id:
        return jsonify({'error': 'No area_id provided'}), 400
    
    # Convertir el area_id a ObjectId de MongoDB
    try:
        area_id_obj = ObjectId(area_id)
    except Exception as e:
        return jsonify({'error': 'Invalid area_id format'}), 400
    
    # Buscar todas las ubicaciones (locations) que coinciden con el area_id
    locations = db.locations.find({'area_id': ObjectId(area_id_obj)})
    #locations = db.locations.find({'facility_id': ObjectId(facility_id)})
    #print(locations)  # Imprimir los resultados
    
    #facilities = db.facilities.find()
    #print(facilities)  # Imprimir los resultados


    # Extraer los facility_id de las ubicaciones encontradas
    facility_ids = [str(location['facility_id']) for location in locations]
    print(facility_ids)  # Imprimir los resultados
    if not facility_ids:
        return jsonify({'error': 'No locations found for the given area_id'}), 404
    
    # Buscar las facilities que coinciden con los facility_id encontrados
    facilities = db.facilities.find({'_id': {'$in': [ObjectId(facility_id) for facility_id in facility_ids]}})

    return jsonify([{'_id': str(facility['_id']), 'name': facility['name'], 'description': facility['description']} for facility in facilities])


@app.route('/api/locations/<area_id>/<facility_id>', methods=['GET'])
def get_locations(area_id, facility_id):
    try:
        area_id_obj = ObjectId(area_id)
        facility_id_obj = ObjectId(facility_id)
    except Exception as e:
        return jsonify({'error': 'Invalid area_id or facility_id format'}), 400

    # Buscar las ubicaciones que coinciden con ambos area_id y facility_id
    locations = db.locations.find({'area_id': area_id_obj, 'facility_id': facility_id_obj})
    #locati = [str(location['_id']) for location in locations]
    #print(locati)  # Imprimir los resultados
    if not locations:
        return jsonify({'error': 'No locations found for the given area_id and facility_id'}), 404

    return jsonify([{'_id': str(location['_id']), 'name': location['name'], 'description': location['description']} for location in locations])


# Obtener concentradores disponibles
@app.route('/api/concentrators/<location_id>', methods=['GET'])
def get_concentrators(location_id):
    concentrators = db.concentrators.find({'location_id': ObjectId(location_id)})
    return jsonify([{'_id': str(concentrator['_id']), 'board': concentrator['board'], 'description': concentrator['description'], 'location_id': str(concentrator['location_id'])} for concentrator in concentrators])


# Obtener sensores disponibles para un concentrador específico
@app.route('/api/sensors/<concentrator_id>', methods=['GET'])
def get_sensors(concentrator_id):
    print(f"Buscando sensores para concentrador: {concentrator_id}")
    try:
        sensors = list(db.sensors.find({'concentrator_id': ObjectId(concentrator_id)}))
        print(f"Sensores encontrados: {sensors}")
        return jsonify([{
            '_id': str(sensor['_id']), 
            'name': sensor['name'], 
            'type': sensor['type'], 
            'description': sensor['description']
        } for sensor in sensors])
    except Exception as e:
        print(f"Error al obtener sensores: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Obtener sensores disponibles
@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors():
    sensors = db.sensors.find()
    return jsonify([{'_id': str(sensor['_id']), 'name': sensor['name'], 'type': sensor['type'], 'description': sensor['description']} for sensor in sensors])


# Crear un experimento
@app.route('/api/experiments', methods=['POST'])
def create_experiment():
    try:
        data = request.get_json()
        print("Datos recibidos:", data)
        
        # Validar datos requeridos
        required_fields = ['name', 'description', 'sensors']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo requerido faltante: {field}'}), 400
        
        # Crear el documento del experimento
        experiment = {
            "name": data['name'],
            "schema": data.get('schema', '1.0.0'),
            "start_timestamp": datetime.utcnow(),
            "end_timestamp": datetime.utcnow() + timedelta(days=30),
            "description": data['description'],
            "sensor_ids": [ObjectId(sensor) for sensor in data['sensors']]
        }
        
        print("Documento a insertar:", experiment)
        
        # Insertar el experimento en la base de datos
        result = db.experiments.insert_one(experiment)
        
        # Verificar si la inserción fue exitosa
        if result.inserted_id:
            return jsonify({
                'message': 'Experiment created successfully',
                'experiment_id': str(result.inserted_id)
            }), 201
        else:
            return jsonify({'error': 'Failed to create experiment'}), 500
            
    except Exception as e:
        print("Error al crear experimento:", str(e))
        return jsonify({'error': str(e)}), 500


# Obtener todos los experimentos
@app.route('/api/experiments/all', methods=['GET'])
def get_all_experiments():
    try:
        experiments = db.experiments.find()
        experiments_list = []
        
        for exp in experiments:
            # Obtener la información completa de los sensores
            sensor_details = []
            for sensor_id in exp['sensor_ids']:
                sensor = db.sensors.find_one({'_id': sensor_id})
                if sensor:
                    sensor_details.append({
                        'id': str(sensor['_id']),
                        'type': sensor['type'],
                        'name': sensor.get('name', ''),
                        'description': sensor.get('description', '')
                    })
            
            experiments_list.append({
        '_id': str(exp['_id']),
        'name': exp['name'],
        'description': exp['description'],
        'start_timestamp': exp['start_timestamp'],
        'end_timestamp': exp['end_timestamp'],
                'sensors': sensor_details  # Enviamos los detalles completos de los sensores
            })
        
        return jsonify(experiments_list)
    except Exception as e:
        print("Error al obtener experimentos:", str(e))
        return jsonify({'error': str(e)}), 500


# Obtener un experimento específico
@app.route('/api/experiments/<experiment_id>', methods=['GET'])
def get_experiment(experiment_id):
    try:
        experiment = db.experiments.find_one({'_id': ObjectId(experiment_id)})
        if experiment:
            # Obtener la información completa de los sensores
            sensor_details = []
            for sensor_id in experiment['sensor_ids']:
                sensor = db.sensors.find_one({'_id': sensor_id})
                if sensor:
                    sensor_details.append({
                        'id': str(sensor['_id']),  # Asegurarse de que el ID sea string
                        'type': sensor['type'],
                        'name': sensor.get('name', ''),
                        'description': sensor.get('description', '')
                    })
            
            return jsonify({
                '_id': str(experiment['_id']),
                'name': experiment['name'],
                'description': experiment['description'],
                'start_timestamp': experiment['start_timestamp'],
                'end_timestamp': experiment['end_timestamp'],
                'sensors': sensor_details
            })
        return jsonify({'error': 'Experimento no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sensors/<sensor_id>', methods=['GET'])
def get_sensor(sensor_id):
    try:
        sensor = db.sensors.find_one({'_id': ObjectId(sensor_id)})
        if sensor:
            return jsonify({
                'id': str(sensor['_id']),
                'type': sensor['type'],
                'name': sensor.get('name', ''),
                'description': sensor.get('description', '')
            })
        return jsonify({'error': 'Sensor no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500












# WebSocket para datos en tiempo real
@socketio.on('connect')
def handle_connect():
    logger.info('Cliente conectado')
    # Verificar la conexión a MongoDB antes de iniciar el envío de datos
    try:
        total_docs = db["measurements"].count_documents({})
        logger.info(f"Total de documentos en measurements al conectar: {total_docs}")
        socketio.start_background_task(send_data)
    except Exception as e:
        logger.error(f"Error al verificar documentos: {str(e)}")

@socketio.on('subscribe')
def handle_subscribe(sensor_id):
    # Aquí implementarías la lógica para obtener datos del sensor
    # y emitirlos al cliente
    pass


# Obtener datos del experimento y sus sensores
def get_experiment_data(experiment_id, from_date, to_date):
    """
    Obtener datos de mediciones para un experimento específico
    """
    try:
        # Convertir el ID del experimento a ObjectId
        exp_id = ObjectId(experiment_id)
        
        # Obtener el experimento y sus sensores
        experiment = db.experiments.find_one({"_id": exp_id})
        if not experiment:
            logger.error(f"Experimento no encontrado: {experiment_id}")
            return None
        
        logger.info(f"Procesando experimento: {experiment.get('name', 'Sin nombre')}")
        
        sensor_ids = experiment.get('sensor_ids', [])
        if not sensor_ids:
            logger.warning(f"No hay sensores asociados al experimento: {experiment_id}")
            return None

        logger.info(f"Sensores a consultar: {sensor_ids}")
        logger.info(f"Rango de fechas: {from_date} a {to_date}")

        # Convertir los IDs de string a ObjectId
        sensor_ids = [ObjectId(sid) for sid in sensor_ids]
        
        # Primero, verificar si hay datos
        sample_data = db.measurements.find_one({"sensor_id": {"$in": sensor_ids}})
        if sample_data:
            logger.info("Estructura de ejemplo de medición:")
            logger.info(f"- Timestamp: {sample_data.get('timestamp')}")
            logger.info(f"- Sensor ID: {sample_data.get('sensor_id')}")
            logger.info(f"- Métricas disponibles: {list(sample_data.get('metrics', {}).keys())}")
        
        # Pipeline para obtener las mediciones
        pipeline = [
            {
                "$match": {
                    "sensor_id": {"$in": sensor_ids},
                    "timestamp": {
                        "$gte": from_date,
                        "$lte": to_date
                    }
                }
            },
            {
                "$sort": {
                    "timestamp": 1
                }
            },
            {
                "$project": {
                    "timestamp": 1,
                    "sensor_id": 1,
                    "metrics": 1
                }
            }
        ]

        # Ejecutar el pipeline
        measurements = list(db.measurements.aggregate(pipeline))
        
        # Log detallado de los resultados
        logger.info(f"Encontradas {len(measurements)} mediciones para el experimento {experiment_id}")
        
        if measurements:
            logger.info("Muestra de datos obtenidos:")
            for i, measurement in enumerate(measurements[:3]):  # Mostrar primeros 3 registros
                logger.info(f"\nMedición {i + 1}:")
                logger.info(f"- Timestamp: {measurement['timestamp']}")
                logger.info(f"- Sensor: {measurement['sensor_id']}")
                logger.info(f"- Métricas: {measurement['metrics']}")
            
            if len(measurements) > 3:
                logger.info(f"... y {len(measurements) - 3} mediciones más")
        
        return measurements

    except Exception as e:
        logger.error(f"Error al obtener datos del experimento: {str(e)}")
        logger.exception("Stacktrace completo:")
        return None

def get_data(experiment_id, from_date, to_date, metric_type=None):
    """
    Obtener datos de mediciones para un experimento específico
    """
    try:
        experiment = db.experiments.find_one({"_id": ObjectId(experiment_id)})
        if not experiment:
            return []

        sensor_ids = experiment.get('sensor_ids', [])
        if not sensor_ids:
            return []

        # Pipeline de agregación para eliminar duplicados
        pipeline = [
            {
                "$match": {
                    "sensor_id": {"$in": sensor_ids},
                    "timestamp": {
                        "$gte": from_date,
                        "$lte": to_date
                    }
                }
            },
            # Agrupar por sensor_id y timestamp para eliminar duplicados
            {
                "$group": {
                    "_id": {
                        "sensor_id": "$sensor_id",
                        "timestamp": "$timestamp"
                    },
                    "metrics": {"$first": "$metrics"},
                    "timestamp": {"$first": "$timestamp"},
                    "sensor_id": {"$first": "$sensor_id"}
                }
            },
            # Reconstruir el documento
            {
                "$project": {
                    "_id": 0,
                    "sensor_id": "$sensor_id",
                    "timestamp": "$timestamp",
                    "metrics": "$metrics"
                }
            },
            # Ordenar por timestamp
            {"$sort": {"timestamp": 1}}
        ]

        measurements = list(db.measurements.aggregate(pipeline))
        logger.info(f"Encontradas {len(measurements)} mediciones únicas")
        
        return measurements

    except Exception as e:
        logger.error(f"Error al obtener datos: {str(e)}")
        logger.exception("Stacktrace completo:")
        return []




@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Cliente desconectado')

# Para verificar la conexión a MongoDB
try:
    db.command('ping')
    logger.info("Conexión exitosa a MongoDB")
except Exception as e:
    logger.error(f"Error de conexión a MongoDB: {str(e)}")

# Ruta para probar la conexión
@app.route("/")
def index():
    return "Conexión establecida"

# Variable para almacenar las tareas en segundo plano por experimento
experiment_tasks = {}

@socketio.on('subscribe_experiment')
def handle_experiment_subscription(experiment_id):
    """
    Manejar la suscripción a un experimento
    """
    try:
        logger.info(f"\n{'='*50}")
        logger.info(f"Nueva suscripción para experimento: {experiment_id}")
        logger.info(f"{'='*50}\n")
        
        # Verificar que el experimento existe
        experiment = db.experiments.find_one({"_id": ObjectId(experiment_id)})
        if not experiment:
            logger.error(f"Experimento no encontrado: {experiment_id}")
            return

        # Cancelar tarea existente si hay una
        if experiment_id in experiment_tasks:
            experiment_tasks[experiment_id]['active'] = False
            logger.info(f"Tarea anterior cancelada para experimento: {experiment_id}")

        # Crear nuevo diccionario de control para la tarea
        experiment_tasks[experiment_id] = {'active': True}
        
        # Iniciar tarea en segundo plano
        socketio.start_background_task(
            send_experiment_data,
            experiment_id=experiment_id
        )
        
    except Exception as e:
        logger.error(f"Error en la suscripción del experimento: {str(e)}")
        logger.exception("Stacktrace completo:")

def send_experiment_data(experiment_id):
    """
    Enviar datos del experimento en tiempo real
    """
    try:
        last_timestamp = datetime.utcnow() - timedelta(minutes=50)
        sent_data_cache = {}  # Diccionario para almacenar el último timestamp por sensor
        
        while experiment_id in experiment_tasks and experiment_tasks[experiment_id]['active']:
            current_time = datetime.utcnow()
            
            data = get_data(experiment_id, last_timestamp, current_time)
            new_data = []

            if data:
                for measurement in data:
                    sensor_id = str(measurement['sensor_id'])
                    timestamp = measurement['timestamp']
                    
                    # Verificar si este dato es más reciente que el último enviado para este sensor
                    if (sensor_id not in sent_data_cache or 
                        timestamp > sent_data_cache[sensor_id]):
                        new_data.append(measurement)
                        sent_data_cache[sensor_id] = timestamp

                if new_data:
                    serialized_data = [serialize_measurement(m) for m in new_data]
                    socketio.emit(f'experiment_data_{experiment_id}', serialized_data)
                    logger.info(f"Enviadas {len(serialized_data)} mediciones nuevas")
            
            last_timestamp = current_time
            socketio.sleep(0.1)
            
    except Exception as e:
        logger.error(f"Error en send_experiment_data: {str(e)}")

@socketio.on('unsubscribe_experiment')
def handle_experiment_unsubscription(experiment_id):
    """
    Manejar la desuscripción de un experimento
    """
    try:
        logger.info(f"Desuscripción del experimento: {experiment_id}")
        
        if experiment_id in experiment_tasks:
            experiment_tasks[experiment_id]['active'] = False
            logger.info(f"Tarea marcada para finalización: {experiment_id}")
        
    except Exception as e:
        logger.error(f"Error al desuscribirse del experimento: {str(e)}")
        logger.exception("Stacktrace completo:")

def get_experiment_metrics(experiment_id):
    """Obtener las métricas disponibles para los sensores de un experimento"""
    try:
        # Obtener el experimento
        experiment = db.experiments.find_one({"_id": ObjectId(experiment_id)})
        if not experiment:
            logger.error(f"No se encontró el experimento: {experiment_id}")
            return []

        sensor_ids = experiment.get('sensor_ids', [])
        
        # Obtener una muestra de mediciones para cada sensor
        metrics_set = set()
        for sensor_id in sensor_ids:
            # Obtener la medición más reciente del sensor
            sample = db.measurements.find_one(
                {"sensor_id": sensor_id},
                {"metrics": 1}
            )
            if sample and "metrics" in sample:
                # Agregar las métricas encontradas al conjunto
                metrics_set.update(sample["metrics"].keys())

        metrics_list = list(metrics_set)
        logger.info(f"Métricas encontradas para experimento {experiment_id}: {metrics_list}")
        return metrics_list

    except Exception as e:
        logger.error(f"Error al obtener métricas del experimento: {str(e)}")
        logger.exception("Stacktrace completo:")
        return []




def serialize_data(data):
    for item in data:
        for key in item:
            if isinstance(item[key], datetime):  # Convierte cualquier datetime a string
                item[key] = item[key].isoformat()  # Formato ISO 8601
    return data


# Variable para almacenar el último timestamp
last_sent_timestamp = None

def send_data(experiment_id):
    global last_sent_timestamp
    metric_types = experiment_id
    with app.app_context():
        while True:
            for metric in metric_types:
                # Si es la primera vez que se ejecuta, obtener los últimos 5 segundos
                if last_sent_timestamp is None:
                   from_date = datetime.utcnow() - timedelta(seconds=5)
                else:
                    from_date = last_sent_timestamp
                to_date = datetime.utcnow()
                
                data = get_data(from_date, to_date, metric)
                if data:
                    serialized_data = serialize_data(data)
                    print(serialized_data)  # Confirmar que los datos están correctamente serializados
                    socketio.emit("new_data", {metric: serialized_data})
                else:
                    print(f"No data found for {metric} from {from_date} to {to_date}")
                
                time.sleep(0.25)  # Esperar 250ms antes de enviar datos nuevamente

            last_sent_timestamp = datetime.utcnow()  # Actualizar el último timestamp
            print(f"Sending data at {datetime.utcnow()}")

def serialize_measurement(measurement):
    """
    Serializar una medición para envío por WebSocket
    """
    return {
        'timestamp': measurement['timestamp'].isoformat(),
        'sensor_id': str(measurement['sensor_id']),  # Convertir ObjectId a string
        'metrics': measurement['metrics']
    }

# Agregar estas colecciones
csv_files = db['csv_files']

@app.route('/api/experiments/<experiment_id>/update-timestamp', methods=['PUT'])
def update_experiment_timestamp(experiment_id):
    try:
        data = request.json
        update_data = {}
        
        if 'start_timestamp' in data:
            update_data['start_timestamp'] = datetime.fromisoformat(data['start_timestamp'].replace('Z', '+00:00'))
        if 'end_timestamp' in data:
            update_data['end_timestamp'] = datetime.fromisoformat(data['end_timestamp'].replace('Z', '+00:00'))
        
        # Actualizar estado de muestreo
        if 'is_sampling' in data:
            update_data['is_sampling'] = data['is_sampling']
        
        result = db.experiments.update_one(
            {'_id': ObjectId(experiment_id)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Experimento actualizado correctamente'}), 200
        return jsonify({'error': 'No se pudo actualizar el experimento'}), 404
        
    except Exception as e:
        logger.error(f"Error al actualizar experimento: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/experiments/<experiment_id>/download-csv', methods=['POST'])
def generate_csv(experiment_id):
    try:
        data = request.json
        experiment = db.experiments.find_one({'_id': ObjectId(experiment_id)})
        
        if not experiment:
            return jsonify({'error': 'Experimento no encontrado'}), 404

        # Usar los timestamps almacenados en el experimento
        start_time = experiment.get('start_timestamp')
        end_time = experiment.get('end_timestamp') or datetime.now(pytz.UTC)
        auto_save = data.get('auto_save', False)

        # Obtener las mediciones
        measurements = list(db.measurements.find({
            'sensor_id': {'$in': experiment['sensor_ids']},
            'timestamp': {
                '$gte': start_time,
                '$lte': end_time
            }
        }).sort('timestamp', 1))

        # Crear el CSV en memoria
        output = io.StringIO()
        writer = csv.writer(output)

        # Escribir encabezado
        writer.writerow(['Timestamp', 'Sensor ID', 'Sensor Name', 'Metric Type', 'Value', 'Unit'])

        # Procesar y ordenar todas las mediciones
        all_data = []
        for measurement in measurements:
            sensor = db.sensors.find_one({'_id': ObjectId(measurement['sensor_id'])})
            sensor_name = sensor['name'] if sensor else 'Unknown Sensor'
            
            for metric_type, metric_data in measurement['metrics'].items():
                all_data.append({
                    'timestamp': measurement['timestamp'],
                    'sensor_id': str(measurement['sensor_id']),
                    'sensor_name': sensor_name,
                    'metric_type': metric_type,
                    'value': metric_data['value'],
                    'unit': metric_data['unit']
                })

        # Ordenar por timestamp y luego por tipo de métrica
        all_data.sort(key=lambda x: (x['timestamp'], x['metric_type']))

        # Escribir datos ordenados
        for data_point in all_data:
            writer.writerow([
                data_point['timestamp'].isoformat(),
                data_point['sensor_id'],
                data_point['sensor_name'],
                data_point['metric_type'],
                data_point['value'],
                data_point['unit']
            ])

        # Usar timestamp actual para el nombre del archivo
        current_time = datetime.now(pytz.UTC)
        filename = f"{experiment['name']}_{current_time.strftime('%Y%m%d_%H%M%S')}.csv"
        
        file_data = {
            'experiment_id': ObjectId(experiment_id),
            'experiment_name': experiment['name'],
            'filename': filename,
            'created_at': current_time,
            'start_time': start_time,
            'end_time': end_time,
            'content': output.getvalue(),
            'metrics': list(set(d['metric_type'] for d in all_data)),
            'auto_generated': auto_save
        }
        
        csv_files.insert_one(file_data)

        # Si es guardado automático, solo guardar en la base de datos
        if auto_save:
            return jsonify({
                'message': 'Archivo CSV guardado correctamente',
                'filename': filename
            }), 200

        # Si no es automático, enviar el archivo para descarga
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        logger.error(f"Error al generar CSV: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/csv-files', methods=['GET'])
def get_csv_files():
    try:
        files = list(csv_files.find().sort('created_at', -1))
        return jsonify([{
            'id': str(f['_id']),
            'experiment_id': str(f['experiment_id']),
            'experiment_name': f['experiment_name'],
            'filename': f['filename'],
            'created_at': f['created_at'].isoformat(),
            'start_time': f['start_time'].isoformat(),
            'end_time': f['end_time'].isoformat()
        } for f in files])

    except Exception as e:
        logger.error(f"Error al obtener archivos CSV: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/csv-files/<file_id>/download', methods=['GET'])
def download_csv(file_id):
    try:
        file_data = csv_files.find_one({'_id': ObjectId(file_id)})
        if not file_data:
            return jsonify({'error': 'Archivo no encontrado'}), 404

        return send_file(
            io.BytesIO(file_data['content'].encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=file_data['filename']
        )

    except Exception as e:
        logger.error(f"Error al descargar archivo CSV: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/csv-files/<file_id>', methods=['DELETE'])
def delete_csv_file(file_id):
    try:
        result = csv_files.delete_one({'_id': ObjectId(file_id)})
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Archivo eliminado correctamente'}), 200
        else:
            return jsonify({'error': 'Archivo no encontrado'}), 404

    except Exception as e:
        logger.error(f"Error al eliminar archivo CSV: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/experiments/<experiment_id>/status', methods=['GET'])
def get_experiment_status(experiment_id):
    try:
        experiment = db.experiments.find_one({'_id': ObjectId(experiment_id)})
        if not experiment:
            return jsonify({'error': 'Experimento no encontrado'}), 404

        return jsonify({
            'is_sampling': experiment.get('is_sampling', False),
            'start_timestamp': experiment.get('start_timestamp'),
            'end_timestamp': experiment.get('end_timestamp')
        })

    except Exception as e:
        logger.error(f"Error al obtener estado del experimento: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Eliminar un experimento
@app.route('/api/experiments/<experiment_id>', methods=['DELETE'])
def delete_experiment(experiment_id):
    try:
        # Verificar si el experimento existe
        experiment = db.experiments.find_one({'_id': ObjectId(experiment_id)})
        if not experiment:
            return jsonify({'error': 'Experimento no encontrado'}), 404

        # Eliminar el experimento
        result = db.experiments.delete_one({'_id': ObjectId(experiment_id)})
        
        if result.deleted_count > 0:
            # También eliminar las mediciones asociadas
            db.measurements.delete_many({'experiment_id': ObjectId(experiment_id)})
            return jsonify({'message': 'Experimento eliminado correctamente'}), 200
        
        return jsonify({'error': 'No se pudo eliminar el experimento'}), 400

    except Exception as e:
        logger.error(f"Error al eliminar experimento: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Iniciando servidor Flask-SocketIO...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)