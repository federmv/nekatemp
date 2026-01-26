# ESP32 Temperature Monitor - Oracle Cloud

Este proyecto permite monitorear la temperatura de un ESP32 en una página web alojada en Oracle Cloud.

## Estructura
- `/backend`: Servidor Node.js + Express + SQLite.
- `/frontend`: Dashboard en React (Vite).
- `/esp32`: Código Arduino para el microcontrolador.

## Instrucciones para Oracle Cloud

### 1. Preparar la Instancia (VM)
1. Crea una instancia Compute (Ubuntu o Oracle Linux).
2. **Configurar Red (VCN):**
   - Ve a `Redes` > `VCN` > `Listas de Seguridad`.
   - Agrega una **Regla de Entrada (Ingress Rule)**:
     - CIDR de origen: `0.0.0.0/0`
     - Protocolo IP: `TCP`
     - Rango de puertos de destino: `3001` (del backend) y `5173` (si pruebas el front suelto) o `80/443`.

### 2. Abrir Puertos en el SO (Ubuntu)
Conéctate por SSH y ejecuta:
```bash
sudo ufw allow 3001/tcp
# O si usas iptables (común en Oracle Cloud):
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo netfilter-persistent save
```

### 3. Instalación de Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. Lanzar el Proyecto
Sube los archivos y en `/backend`:
```bash
npm install
npm start
```
Se recomienda usar `pm2` para mantener el servidor corriendo:
```bash
sudo npm install -g pm2
pm2 start server.js
```

## Configuración del ESP32
1. Abre `/esp32/esp32_monitor.ino` en Arduino IDE.
2. Instala la librería `ArduinoJson` desde el Gestor de Librerías.
3. Cambia `TU_WIFI_SSID`, `TU_WIFI_PASSWORD` y `TU_IP_ORACLE_WEB`.
4. Carga el código al ESP32.
