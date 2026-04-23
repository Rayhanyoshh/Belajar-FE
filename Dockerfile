# ==========================================
# STAGE 1: PEMBANGUNAN (BUILD STAGE)
# ==========================================
# Kita meminjam mesin Node.js untuk mengubah kode React & TypeScript 
# menjadi HTML/JS statis yang ringan.
FROM node:18-alpine AS build

WORKDIR /app

# Meng-copy resep (package.json) dan mendownload semua komponen (shadcn, react, dll)
COPY package.json ./
RUN npm install

# Memasukkan seluruh kode sumber
COPY . .

# Mengkompilasi React menjadi file HTML/JS/CSS statis di folder /dist
RUN npm run build

# ==========================================
# STAGE 2: PENYAJIAN (PRODUCTION STAGE)
# ==========================================
# Kita menggunakan Nginx (Web Server tercepat) untuk menyajikan hasil jadinya.
FROM nginx:alpine

# Kita MENGAMBIL folder /dist dari mesin Node.js (Stage 1)
# lalu memasukkannya ke folder publik milik Nginx.
COPY --from=build /app/dist /usr/share/nginx/html

# Buka gerbang port 80
EXPOSE 80

# Nyalakan Nginx selamanya
CMD ["nginx", "-g", "daemon off;"]
