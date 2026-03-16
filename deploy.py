"""Deploy 十三香小龙虾 website to remote server via SSH."""
import paramiko
import os
import stat

HOST = "150.129.80.123"
USER = "ubuntu"
PASS = "iHkatal#B7"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_DIR = "/var/www/shisanxiang"

NGINX_CONF = r"""
server {
    listen 80;
    server_name 13x.lol ai26.sbs www.13x.lol www.ai26.sbs;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    server_name _;
    root /var/www/shisanxiang;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript text/xml image/svg+xml;
    location / { try_files $uri $uri/ /index.html; }
}

server {
    listen 443 ssl http2;
    server_name 13x.lol www.13x.lol ai26.sbs www.ai26.sbs;

    ssl_certificate /etc/letsencrypt/live/13x.lol/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/13x.lol/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    root /var/www/shisanxiang;
    index index.html;

    gzip on;
    gzip_comp_level 6;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css application/javascript application/json text/xml image/svg+xml application/manifest+json;
    gzip_min_length 256;

    location ~* \.(css|js|svg|woff2?)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(png|jpg|jpeg|gif|ico|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    location = /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = /manifest.json {
        add_header Cache-Control "public, max-age=86400";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[1/5] Connecting to {HOST}...")
    ssh.connect(HOST, username=USER, password=PASS, timeout=15)
    print("      Connected!")

    def run(cmd, sudo=False):
        if sudo:
            cmd = f"echo '{PASS}' | sudo -S bash -c '{cmd}'"
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        code = stdout.channel.recv_exit_status()
        if out:
            print(f"      {out[:200]}")
        if code != 0 and err:
            filtered = [l for l in err.split('\n') if '[sudo]' not in l and 'password' not in l.lower()]
            if filtered:
                print(f"      WARN: {' '.join(filtered)[:200]}")
        return out, err, code

    print(f"[2/5] Installing nginx...")
    run("apt-get update -qq && apt-get install -y -qq nginx", sudo=True)
    print("      nginx installed!")

    print(f"[3/5] Uploading website files to {REMOTE_DIR}...")
    run(f"mkdir -p {REMOTE_DIR}/css {REMOTE_DIR}/js", sudo=True)
    run(f"chown -R {USER}:{USER} {REMOTE_DIR}", sudo=True)

    sftp = ssh.open_sftp()
    for root, dirs, files in os.walk(LOCAL_DIR):
        for fname in files:
            if fname in ('deploy.py', 'setup_ssl.py', '.git') or fname.startswith('.'):
                continue
            local_path = os.path.join(root, fname)
            rel_path = os.path.relpath(local_path, LOCAL_DIR).replace("\\", "/")
            if rel_path.startswith(".git"):
                continue
            remote_path = f"{REMOTE_DIR}/{rel_path}"
            try:
                sftp.stat(os.path.dirname(remote_path))
            except FileNotFoundError:
                sftp.mkdir(os.path.dirname(remote_path))
            sftp.put(local_path, remote_path)
            print(f"      OK {rel_path}")
    sftp.close()

    print("[4/5] Configuring nginx...")
    tmp_conf = "/tmp/shisanxiang_nginx.conf"
    sftp2 = ssh.open_sftp()
    with sftp2.file(tmp_conf, 'w') as f:
        f.write(NGINX_CONF)
    sftp2.close()

    run(f"cp {tmp_conf} /etc/nginx/sites-available/shisanxiang", sudo=True)
    run("rm -f /etc/nginx/sites-enabled/default", sudo=True)
    run("ln -sf /etc/nginx/sites-available/shisanxiang /etc/nginx/sites-enabled/shisanxiang", sudo=True)
    run("nginx -t", sudo=True)

    print("[5/5] Starting nginx...")
    run("systemctl enable nginx && systemctl restart nginx", sudo=True)
    out, _, _ = run("systemctl is-active nginx")

    print("\n" + "=" * 50)
    if "active" in out:
        print(f"  DEPLOY SUCCESS!")
        print(f"  URL: http://{HOST}")
    else:
        print(f"  nginx status: {out}")
        print(f"  Check firewall port 80")
    print("=" * 50)

    ssh.close()

if __name__ == "__main__":
    main()
