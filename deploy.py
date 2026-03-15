"""Deploy 十三香小龙虾 website to remote server via SSH."""
import paramiko
import os
import stat

HOST = "150.129.80.123"
USER = "ubuntu"
PASS = "iHkatal#B7"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_DIR = "/var/www/shisanxiang"

NGINX_CONF = """server {
    listen 80;
    server_name _;

    root /var/www/shisanxiang;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript text/xml;
    gzip_min_length 256;

    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
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
            if fname in ('deploy.py', '.git') or fname.startswith('.'):
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
