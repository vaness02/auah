# Gunakan image dasar yang mendukung Python
FROM python:3.9-slim

# Setel direktori kerja dalam container
WORKDIR /app

# Salin file requirements.txt dan instal dependensi Python
COPY requirements.txt .

# Instalasi dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Salin semua file ke direktori kerja dalam container
COPY . .

# Ekspose port jika aplikasi Anda berjalan di port tertentu (misalnya, 5000)
EXPOSE 5000

# Tentukan perintah untuk menjalankan aplikasi Anda
CMD ["python", "app.py"]
