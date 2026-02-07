# Festickers 部署指南

域名：**festickers.com**  
后端 IP：**47.238.248.169**  
DNS：`api.festickers.com` → 47.238.248.169 | `@`、`www` → Vercel

---

## 第一步：部署后端（阿里云香港服务器）

### 1.1 连接服务器

1. 阿里云控制台 → Simple Application Server → 选择服务器 → **Remote Connection**
2. 或使用 SSH（先点击 **Set Password** 设置 root 密码）：
   ```bash
   ssh root@47.238.248.169
   ```

### 1.2 安装 Node.js

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证
node -v   # v20.x.x
npm -v
```

### 1.3 安装 Git 和 PM2

```bash
apt install -y git
npm install -g pm2
```

### 1.4 克隆代码并构建

```bash
cd /var
git clone https://github.com/Tracytang-engi/Festive_Project.git
cd Festive_Project/server
```

### 1.5 配置环境变量

```bash
nano .env
```

填入以下内容（按实际情况修改）：

```
MONGODB_URI=mongodb://localhost:27017/festive-app
JWT_SECRET=你的JWT密钥_请改为随机长字符串
HMAC_SECRET=super_secret_hmac_key_change_me
```

> 若使用 MongoDB Atlas，将 `MONGODB_URI` 改为 Atlas 连接串。

保存：`Ctrl+O` 回车，`Ctrl+X` 退出。

### 1.6 安装依赖并构建

```bash
npm install
npm run build
```

### 1.7 创建 uploads 目录并启动

```bash
mkdir -p uploads
pm2 start dist/app.js --name festive-api
pm2 save
pm2 startup   # 按提示执行输出的命令，实现开机自启
```

### 1.8 放行防火墙端口

阿里云控制台 → 服务器 → **防火墙** → 添加入站规则：

- 端口：**3000**，协议：TCP
- 端口：**80**，协议：TCP（用于 Nginx，见下方）
- 端口：**443**，协议：TCP（用于 HTTPS）

### 1.9 测试后端

```bash
curl http://localhost:3000/health
# 应返回 {"status":"ok"}
```

浏览器访问：`http://47.238.248.169:3000/health`

---

## 第二步：为 api.festickers.com 配置 HTTPS（Nginx + Let's Encrypt）

### 2.1 安装 Nginx 和 Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 2.2 配置 Nginx

```bash
nano /etc/nginx/sites-available/festickers-api
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name api.festickers.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

保存后启用：

```bash
ln -sf /etc/nginx/sites-available/festickers-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 2.3 申请 SSL 证书

```bash
certbot --nginx -d api.festickers.com
```

按提示输入邮箱、同意条款。Certbot 会自动配置 HTTPS。

### 2.4 验证

访问 `https://api.festickers.com/health` 应返回 `{"status":"ok"}`。

---

## 第三步：部署前端（Vercel）

### 3.1 推送代码到 GitHub

已修改 `client/src/api/client.ts`，使用 `VITE_API_URL`。确认修改已提交并推送：

```bash
git add .
git commit -m "feat: use VITE_API_URL for production API"
git push origin master
```

### 3.2 在 Vercel 创建项目

1. 打开 [vercel.com](https://vercel.com) 并登录
2. **Add New** → **Project**
3. 选择 **Tracytang-engi/Festive_Project**
4. 配置：
   - **Root Directory**：`client`
   - **Framework Preset**：Vite
   - **Build Command**：`npm run build`
   - **Output Directory**：`dist`

### 3.3 设置环境变量

在 Environment Variables 中添加：

| Key | Value |
|-----|-------|
| VITE_API_URL | https://api.festickers.com |

保存后点击 **Deploy**。

### 3.4 绑定自定义域名

1. 项目 → **Settings** → **Domains**
2. 添加：`festickers.com`、`www.festickers.com`
3. 按 Vercel 提示在 DNS 中配置 CNAME（你已配置 `@` 和 `www` 指向 `cname.vercel-dns.com`，一般无需再改）

---

## 第四步：验证与收尾

1. 访问 **https://festickers.com**
2. 测试注册、登录、主要功能
3. 如有问题，查看：
   - 后端日志：`pm2 logs festive-api`
   - 阿里云防火墙是否放行 80、443、3000

---

## 常用命令

```bash
# 后端
pm2 logs festive-api    # 查看日志
pm2 restart festive-api # 重启
pm2 stop festive-api    # 停止

# 更新代码
cd /var/Festive_Project && git pull
cd server && npm install && npm run build
pm2 restart festive-api
```

---

## 架构概览

```
用户 → https://festickers.com (Vercel 前端)
         ↓ API 请求
      https://api.festickers.com (Nginx → Node.js:3000)
         ↓
      MongoDB (本地或 Atlas)
```
