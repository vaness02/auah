# Gunakan image dasar yang mendukung Python dan GPU jika diperlukan
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install dependencies
RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy source code
COPY . /app
WORKDIR /app

# Copy model and documents
COPY squad_bert /app/squad_bert
COPY MODEL /app/MODEL

# Run the application
CMD ["python", "app.py"]
