# Sistema de Monitoreo de Sensores

Este proyecto es una aplicación web para el monitoreo y gestión de sensores en tiempo real. Permite crear experimentos, visualizar datos de sensores en tiempo real, y exportar datos históricos.

## Características

- 🔍 Monitoreo en tiempo real de sensores
- 📊 Visualización de datos con gráficas interactivas
- 📁 Gestión de experimentos
- 📥 Exportación de datos a CSV
- 🔐 Sistema de autenticación
- 📱 Diseño responsivo

## Tecnologías Utilizadas

### Frontend
- React.js
- Socket.IO Client
- Chart.js
- Axios
- React Router
- CSS3

### Backend
- Python
- Flask
- Socket.IO
- MongoDB
- PyMongo

## Requisitos Previos

- Python 3.8 o superior
- Node.js 14 o superior
- MongoDB 4.4 o superior
- pip (gestor de paquetes de Python)
- npm (gestor de paquetes de Node.js)

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/JunkCross/UAM_PAGE.git
cd UAM_PAGE
```

2. Configurar el entorno virtual de Python:

```bash
python -m venv venv
En Windows: venv\Scripts\activate
source venv/bin/activate 
```

3. Instalar dependencias del backend:

```bash
cd api
pip install -r requirements.txt

pip freeze > requirements.txt
```

4. Instalar dependencias del frontend:

```bash
cd ../
npm install
```

5. Configurar variables de entorno:
   - Crear archivo `venv` en la carpeta `api`
   
   Ejemplo de `venv` para el backend:

## Ejecución

1. Iniciar el backend:

```bash
cd api
python api.py
```

2. En otra terminal, iniciar el frontend:

```bash
cd ../
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```bash
├── api/
│ ├── api.py
│ ├── requirements.txt
│ └── ...
├── src/
│ ├── components/
│ ├── pages/
│ ├── styles/
│ └── ...
├── public/
├── package.json
└── README.md
```

## Uso

1. **Crear un Experimento**
   - Click en "Nuevo Experimento"
   - Completar el formulario con nombre, descripción y sensores
   - Click en "Crear"

2. **Monitorear Sensores**
   - Seleccionar un experimento de la lista
   - Ver gráficas en tiempo real
   - Ajustar rangos de tiempo según necesidad

3. **Exportar Datos**
   - Ir a la sección "Archivos CSV"
   - Seleccionar experimento y rango de fechas
   - Click en "Exportar"









# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
