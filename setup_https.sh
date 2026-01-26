#!/bin/bash

echo "🔌 Configurando HTTPS Automático para Neka Dashboard..."

# 1. Instalar Caddy (Servidor Web Seguro)
echo "📦 Instalando Caddy..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# 2. Detectar IP Pública
IP=$(curl -s ifconfig.me)
DOMAIN="$IP.sslip.io"

echo "🌍 Tu IP es: $IP"
echo "🔒 Tu Dominio Seguro será: https://$DOMAIN"

# 3. Configurar Caddy (Caddyfile)
echo "⚙️  Escribiendo configuración..."
# Usamos tee para escribir con permisos de sudo
echo "$DOMAIN {
    reverse_proxy localhost:3001
}" | sudo tee /etc/caddy/Caddyfile

# 4. Reiniciar Caddy para aplicar cambios
echo "🔄 Aplicando cambios..."
sudo systemctl enable caddy
sudo systemctl reload caddy

echo ""
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "👉 Entra ahora a: https://$DOMAIN"
echo "   (Ahí podrás instalar la App en Android)"
