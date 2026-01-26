# Neka Dashboard - Oracle IoT Monitor

Proyecto completo para monitorear temperatura con ESP32, backend Node.js, base de datos SQLite y frontend React (PWA).

## 🚀 Despliegue Rápido en Oracle Cloud

Si ya clonaste el repo, sigue estos pasos si haces cambios:

```bash
# 1. Actualizar código
cd ~/nekatemp
git pull origin main

# 2. Reconstruir Web (Frontend)
cd frontend
npm install
npm run build

# 3. Reiniciar Servidor (Backend)
pm2 restart server
```

## 🔒 Cómo activar HTTPS (Doble Candado) y PWA Android

Para que aparezca el botón "Instalar App" en Android, necesitas HTTPS. Usaremos **Caddy** y un dominio gratuito `sslip.io`.

1. **Instalar Caddy** (Solo una vez):
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Lanzar HTTPS**:
   Reemplaza `TU_IP` con la IP pública de tu servidor (ej: `141.148.14.52`).
   ```bash
   sudo caddy reverse-proxy --from TU_IP.sslip.io --to localhost:3001
   ```

3. **Acceder:**
   Entra a: `https://141.148.14.52.sslip.io` (¡Nota la 's' en https!).

---

## 📡 Configuración Técnica

### Puertos Necesarios (Ingress Rules)
Asegúrate de abrir estos puertos en Oracle Cloud VCN y en Ubuntu (`iptables`):
- **3001** (HTTP Web / API)
- **1883** (MQTT ESP32)
- **80 y 443** (Para Caddy / HTTPS)

### ESP32
El ESP32 se conecta por MQTT al puerto **1883**.
- Topic: `casa/esp32/datos`
- Mensaje: Solo el valor float (ej: `25.4`).

### Base de Datos
Los datos se guardan en `backend/database.sqlite`.
- Tabla: `measurements` (id, temperature, humidity, timestamp)
- Horario: UTC (La web convierte a hora local Colombia automáticamente).
