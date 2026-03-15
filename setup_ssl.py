"""Set up SSL certificates and Nginx HTTPS for 13x.lol and ai26.sbs."""
import paramiko

HOST = "150.129.80.123"
USER = "ubuntu"
PASS = "iHkatal#B7"

NGINX_CONF = r"""
server {
    listen 80;
    server_name 13x.lol ai26.sbs www.13x.lol www.ai26.sbs;
    return 301 https://$host$request_uri;
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
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    root /var/www/shisanxiang;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript text/xml image/svg+xml;
    gzip_min_length 256;

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[1/4] Connecting to {HOST}...")
    ssh.connect(HOST, username=USER, password=PASS, timeout=15)

    def run(cmd, sudo=False, timeout=180):
        if sudo:
            cmd = f"echo '{PASS}' | sudo -S bash -c '{cmd}'"
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        code = stdout.channel.recv_exit_status()
        if out:
            for line in out.split('\n')[:5]:
                print(f"      {line}")
        return out, err, code

    print("[2/4] Installing certbot...")
    run("apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx", sudo=True)

    print("[3/4] Obtaining SSL certificate for 13x.lol and ai26.sbs...")
    cert_cmd = (
        "certbot certonly --nginx --non-interactive --agree-tos "
        "--email admin@13x.lol "
        "-d 13x.lol -d ai26.sbs "
        "--cert-name 13x.lol "
        "|| certbot certonly --standalone --non-interactive --agree-tos "
        "--email admin@13x.lol "
        "-d 13x.lol -d ai26.sbs "
        "--cert-name 13x.lol"
    )
    out, err, code = run(cert_cmd, sudo=True, timeout=120)
    if code != 0:
        filtered = [l for l in err.split('\n') if 'password' not in l.lower() and '[sudo]' not in l]
        if filtered:
            print(f"      Cert output: {' '.join(filtered)[:300]}")
        print("      Trying standalone mode with nginx stopped...")
        run("systemctl stop nginx", sudo=True)
        cert_cmd2 = (
            "certbot certonly --standalone --non-interactive --agree-tos "
            "--email admin@13x.lol "
            "-d 13x.lol -d ai26.sbs "
            "--cert-name 13x.lol"
        )
        out2, err2, code2 = run(cert_cmd2, sudo=True, timeout=120)
        if code2 != 0:
            filtered2 = [l for l in err2.split('\n') if 'password' not in l.lower() and '[sudo]' not in l]
            print(f"      WARN: {' '.join(filtered2)[:300]}")

    print("[4/4] Configuring Nginx with HTTPS...")
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/shisanxiang_ssl.conf', 'w') as f:
        f.write(NGINX_CONF)
    sftp.close()

    run("cp /tmp/shisanxiang_ssl.conf /etc/nginx/sites-available/shisanxiang", sudo=True)
    run("ln -sf /etc/nginx/sites-available/shisanxiang /etc/nginx/sites-enabled/shisanxiang", sudo=True)
    run("rm -f /etc/nginx/sites-enabled/default", sudo=True)

    out, err, code = run("nginx -t", sudo=True)
    if code != 0:
        print("      Nginx config test failed, falling back to HTTP-only config")
        http_only = """server {
    listen 80;
    server_name 13x.lol ai26.sbs www.13x.lol www.ai26.sbs _;
    root /var/www/shisanxiang;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript text/xml image/svg+xml;
    gzip_min_length 256;
    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}"""
        sftp2 = ssh.open_sftp()
        with sftp2.file('/tmp/shisanxiang_http.conf', 'w') as f:
            f.write(http_only)
        sftp2.close()
        run("cp /tmp/shisanxiang_http.conf /etc/nginx/sites-available/shisanxiang", sudo=True)

    run("systemctl restart nginx", sudo=True)
    out, _, _ = run("systemctl is-active nginx")

    run("certbot renew --dry-run", sudo=True)

    print("\n" + "=" * 50)
    print(f"  Nginx: {out}")
    print(f"  http://13x.lol")
    print(f"  http://ai26.sbs")
    _, cert_check, _ = run("ls /etc/letsencrypt/live/13x.lol/ 2>/dev/null", sudo=True)
    if "No such file" not in str(cert_check):
        print(f"  https://13x.lol")
        print(f"  https://ai26.sbs")
    print("=" * 50)
    ssh.close()

if __name__ == "__main__":
    main()
