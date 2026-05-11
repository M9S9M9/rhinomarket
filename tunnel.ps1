$log = "C:\Users\hp\Desktop\wah\rhino-marketplace\tunnel_url.txt"
ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net 2>&1 | Out-File $log -Encoding utf8
