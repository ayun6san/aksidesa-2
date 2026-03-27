# 📋 Panduan Migrasi SQLite ke MySQL

## 1. Persiapan Database MySQL

### A. Install MySQL (jika belum)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**Windows:**
- Download dari https://dev.mysql.com/downloads/installer/

**Mac:**
```bash
brew install mysql
brew services start mysql
```

### B. Buat Database dan User

```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE aksidesa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user (opsional, untuk keamanan)
CREATE USER 'aksidesa'@'localhost' IDENTIFIED BY 'password_anda';
GRANT ALL PRIVILEGES ON aksidesa.* TO 'aksidesa'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Update Environment Variable

Edit file `.env`:

```env
# MySQL Connection
DATABASE_URL="mysql://root:password@localhost:3306/aksidesa"

# Atau dengan user khusus:
# DATABASE_URL="mysql://aksidesa:password_anda@localhost:3306/aksidesa"
```

## 3. Generate Prisma Client & Push Schema

```bash
# Generate Prisma client
bun run db:generate

# Push schema ke database (membuat tabel)
bun run db:push

# Atau gunakan migration (untuk production)
bunx prisma migrate dev --name init
```

## 4. Migrasi Data dari SQLite (Opsional)

Jika sudah ada data di SQLite yang ingin dipindahkan:

### Cara 1: Export dan Import Manual

```bash
# Export data SQLite ke JSON
# (Buat script atau gunakan Prisma Studio)

# Import ke MySQL
# Jalankan script import
```

### Cara 2: Gunakan Prisma

```bash
# 1. Backup data SQLite
cp db/custom.db db/custom.db.backup

# 2. Set DATABASE_URL ke MySQL
# 3. Jalankan script migrasi
```

## 5. Verifikasi

```bash
# Cek koneksi
bunx prisma db pull

# Buka Prisma Studio
bunx prisma studio
```

## 6. Perbedaan SQLite vs MySQL

| Fitur | SQLite | MySQL |
|-------|--------|-------|
| **File** | file:./db.db | mysql://user:pass@host:port/db |
| **Tipe Data** | TEXT, INTEGER | VARCHAR, INT, TEXT |
| **Boolean** | 0/1 | TINYINT(1) |
| **Auto Increment** | AUTOINCREMENT | AUTO_INCREMENT |
| **Case Sensitive** | Ya | Tergantung collation |
| **Concurrent Access** | Terbatas | Full support |

## 7. Troubleshooting

### Error: Access denied
```
SQLSTATE[HY000] [1045] Access denied for user
```
**Solusi:** Cek username, password, dan privileges

### Error: Unknown database
```
SQLSTATE[HY000] [1049] Unknown database 'aksidesa'
```
**Solusi:** Buat database terlebih dahulu

### Error: Connection refused
```
SQLSTATE[HY000] [2002] Connection refused
```
**Solusi:** Pastikan MySQL server berjalan

## 8. Setup untuk Hosting (Biznet/Railway)

### Railway
```env
DATABASE_URL="${{MySQL.DATABASE_URL}}"
```

### Biznet Gio Cloud
```env
DATABASE_URL="mysql://user:password@host:3306/aksidesa"
```

### PlanetScale (Serverless MySQL)
```env
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/aksidesa?sslaccept=strict"
```
