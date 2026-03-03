# backend/Dockerfile

FROM python:3.11-slim

# create non-root user
RUN useradd --create-home appuser
WORKDIR /app

# install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy source
COPY backend /app

# ensure bytecode compiled
RUN python -m compileall -q /app

# expose default port
EXPOSE 8000

# use non-root user
USER appuser

ENV PORT=8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]
