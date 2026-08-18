#!/usr/bin/env bash
# One-time Oracle VM bootstrap for Kodem dev deploy.
# Clone the repo on the VM, then run from repo root:
#   bash deploy/bootstrap-oracle.sh

set -euo pipefail

APP_DIR=/opt/kodem
DOMAIN="${KODEM_DOMAIN:-dev.kodem.co.il}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing Docker..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
fi

echo "==> Creating app directory..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"
cp "$SCRIPT_DIR/../docker-compose.yml" "$APP_DIR/docker-compose.yml"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "==> Creating $APP_DIR/.env template..."
  cat > "$APP_DIR/.env" <<EOF
IMAGE_TAG=dev
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
APP_URL=https://${DOMAIN}
EOF
  chmod 600 "$APP_DIR/.env"
  echo "Edit $APP_DIR/.env and add OAuth secrets if needed."
fi

echo "==> Configuring nginx for ${DOMAIN}..."
sudo cp "$SCRIPT_DIR/nginx/dev.kodem.co.il.conf" /etc/nginx/sites-available/${DOMAIN}
sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "Bootstrap complete. Next steps:"
echo "1. Point DNS A record for ${DOMAIN} to this server's public IP"
echo "2. Open Oracle VCN ingress: TCP 22, 80, 443"
echo "3. Run: sudo certbot --nginx -d ${DOMAIN}"
echo "4. Add GitHub deploy public key to ~/.ssh/authorized_keys"
echo "5. Configure GitHub Environment 'development' secrets:"
echo "   SSH_HOST, SSH_USER, SSH_KEY, GHCR_PULL_TOKEN"
echo "6. Copy docker-compose.yml to $APP_DIR (or push to dev branch to trigger CI)"
echo "7. Log out/in so docker group membership applies, then:"
echo "   cd $APP_DIR && docker compose pull && docker compose up -d"
