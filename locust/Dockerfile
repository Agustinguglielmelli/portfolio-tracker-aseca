FROM python:3.12-slim

WORKDIR /locust

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY locustfile.py .
COPY tests/ tasks/

EXPOSE 8089

ENTRYPOINT ["locust", "-f", "locustfile.py"]
