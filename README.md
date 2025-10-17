# Tienda CouchDB

Aplicación web para la gestión de productos utilizando CouchDB como base de datos NoSQL.

## Requisitos

- Node.js (v14 o superior)
- CouchDB (v3.0 o superior)
- Cuenta de correo electrónico para la recuperación de contraseñas

## Configuración

1. Instalar CouchDB y asegurarse de que esté ejecutándose en http://localhost:5984
2. Crear un usuario en CouchDB con las credenciales:
   - Usuario: ivan
   - Contraseña: 1234
3. Instalar las dependencias del proyecto:

```bash
npm install
```

4. Configurar las variables de entorno en el archivo `.env`:
   - Para el envío de correos, actualizar EMAIL_USER y EMAIL_PASS con credenciales válidas

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```bash
npm run dev
```

Para iniciar la aplicación en modo producción:

```bash
npm start
```

La aplicación estará disponible en http://localhost:3000

## Funcionalidades

- Sistema de autenticación (login, registro, recuperación de contraseña)
- Gestión de productos (crear, leer, actualizar, eliminar)
- Carga de imágenes para productos
- Generación de reportes en PDF del inventario

## Estructura del Proyecto

- `/config`: Configuración de la base de datos
- `/controllers`: Lógica de negocio
- `/models`: Modelos de datos
- `/public`: Archivos estáticos (CSS, JS, imágenes)
- `/routes`: Definición de rutas
- `/uploads`: Almacenamiento de imágenes subidas
- `/views`: Plantillas EJS

## Despliegue

Para desplegar la aplicación en un servidor:

1. Configurar las variables de entorno para producción
2. Ejecutar `npm install --production`
3. Iniciar la aplicación con `npm start` o utilizando un gestor de procesos como PM2