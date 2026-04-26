# MicroPython Flasher

Una herramienta de flasheo de firmware desde el navegador para microcontroladores ESP32, diseñada específicamente para instalar MicroPython. Creada para integrarse perfectamente en flujos de trabajo educativos y profesionales.

## Tecnologías

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Web Serial API](https://img.shields.io/badge/Web_Serial_API-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

## Descripción General

MicroPython Flasher es una aplicación web moderna y sin necesidad de instalación que aprovecha la Web Serial API y `esptool-js` para comunicarse directamente con placas ESP32 desde el navegador. Guía a los usuarios a través de un proceso ágil tipo asistente para conectar, descargar el firmware adecuado, flashear la memoria y verificar la instalación.

La interfaz presenta un diseño profesional y orientado a desarrolladores, inspirado en el modo oscuro de GitHub, garantizando una experiencia visual limpia y sin distracciones.

## Características principales

*   **Flasheo 100% desde el navegador**: No requiere instalación de programas adicionales ni comandos de terminal (siempre que el sistema tenga los drivers CH340/CP2102).
*   **Detección Automática de Hardware**: Identifica al instante el modelo exacto de ESP32 conectado y su dirección MAC.
*   **Asistente Paso a Paso**: Interfaz fluida que guía al usuario por la Conexión, Descarga de Firmware, Instalación y Verificación.
*   **Consola Integrada**: Terminal en tiempo real visible para monitorizar los logs del proceso de flasheo.
*   **Interfaz Personalizada**: Sistema de diseño basado en módulos CSS puros, sin utilizar librerías de componentes de terceros para asegurar ligereza.

## Requisitos del sistema

*   Un navegador moderno basado en Chromium (Google Chrome, Microsoft Edge, Opera).
*   Una placa ESP32 conectada al PC mediante un cable USB con capacidad de transferencia de datos.
*   Drivers estándar CH340 o CP2102 instalados en tu sistema operativo.

## Desarrollo Local

Para probar y modificar el proyecto localmente:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000` o `http://localhost:5173`.

## Despliegue en producción

El proyecto está preparado para funcionar *out-of-the-box* en plataformas como **Vercel**. 

Al ser una aplicación web estática construida sobre **Vite**, solo tienes que importar el repositorio en Vercel, y la plataforma aplicará automáticamente el comando de construcción (`npm run build`) y el directorio de salida (`dist`).

## Agradecimientos

Herramienta construida utilizando la librería [esptool-js](https://github.com/espressif/esptool-js).

Desarrollado por **Sami González Kamel**.
