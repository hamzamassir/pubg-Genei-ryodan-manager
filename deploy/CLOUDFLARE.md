# Cloudflare Tunnel for GENEx on X260

## Current exposure (quick tunnel)

Quick tunnels are **free** and work without Tailscale for players, but the hostname
**changes whenever `genei-cloudflared` restarts**.

Check the live URL:

```bash
ssh hamza@100.95.212.44
grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' \
  ~/pubg-Genei-ryodan-manager/deploy/cloudflared.log | tail -1
```

Services (user systemd, no sudo):

```bash
systemctl --user status genei-ryodan genei-cloudflared
systemctl --user restart genei-ryodan
systemctl --user restart genei-cloudflared
```

After a tunnel restart, update `APP_ORIGIN` in `~/pubg-Genei-ryodan-manager/.env`
to the new `https://….trycloudflare.com` URL (needed for magic links), then:

```bash
systemctl --user restart genei-ryodan
```

## Recommended: named tunnel (stable hostname, still $0)

1. Put a domain on Cloudflare (free plan) — e.g. `genei.yourdomain.com`
2. On X260:

```bash
~/bin/cloudflared tunnel login          # opens browser once
~/bin/cloudflared tunnel create genei-ryodan
~/bin/cloudflared tunnel route dns genei-ryodan genei.yourdomain.com
```

3. Config `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/hamza/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: genei.yourdomain.com
    service: http://127.0.0.1:3040
  - service: http_status:404
```

4. Point the user service at named tunnel:

```bash
ExecStart=/home/hamza/bin/cloudflared tunnel --no-autoupdate run genei-ryodan
```

5. Set `APP_ORIGIN=https://genei.yourdomain.com` in `.env` and restart.

## Deploy updates

```bash
# Mac
git push

# X260
cd ~/pubg-Genei-ryodan-manager
git pull --ff-only
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
npm ci
npm run build
systemctl --user restart genei-ryodan
```
