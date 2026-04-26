# MicroPython Flasher

A browser-based firmware flashing tool for ESP32 microcontrollers, designed specifically to install MicroPython. Built for seamless integration into educational maker suites and professional workflows.

## Technology Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Web Serial API](https://img.shields.io/badge/Web_Serial_API-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

## Overview

MicroPython Flasher is a modern, zero-installation web application that leverages the Web Serial API and `esptool-js` to communicate directly with ESP32 devices from the browser. It guides users through a streamlined, wizard-like process to connect, download the appropriate firmware, flash the memory, and verify the installation. 

The interface features a professional, developer-centric design inspired by GitHub's dark mode, ensuring a distraction-free experience.

## Features

*   **Browser-Based Flashing**: No driver installations or terminal commands required (provided CH340/CP2102 drivers are present).
*   **Automatic Chip Detection**: Identifies the connected ESP32 model and its MAC address.
*   **Step-by-Step Wizard**: Guides the user through Connection, Installation, and Verification.
*   **Integrated Console**: Real-time terminal output for monitoring the flashing process.
*   **Zero Dependencies UI**: Custom-built CSS module architecture without reliance on external component libraries.

## Requirements

*   A Chromium-based browser supporting the Web Serial API (Chrome, Edge, Opera).
*   An ESP32 microcontroller connected via a data-capable USB cable.
*   Standard CH340 or CP2102 USB-to-Serial drivers installed on the host machine.

## Local Development

To run the project locally, clone the repository and install the dependencies:

```bash
npm install
npm run dev
```

The development server will start, typically accessible at `http://localhost:3000` or `http://localhost:5173`.

## Deployment

This application is optimized for deployment on Vercel. Because it is a static Single Page Application (SPA) built with Vite, Vercel will automatically detect the optimal build configuration.

1. Import the repository into Vercel.
2. Vercel will automatically configure the build command (`npm run build`) and output directory (`dist`).
3. Deploy the application.

## Acknowledgements

Powered by `esptool-js` for Web Serial communication.

By Sami González Kamel.
