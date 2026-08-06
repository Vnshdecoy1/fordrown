FROM node:22-slim

# Install Python, Chrome, and tools
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    wget curl gnupg ca-certificates \
    fonts-liberation libasound2 libatk-bridge2.0-0 libcups2 libdrm2 \
    libgbm1 libnspr4 libnss3 libxkbcommon0 xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome.deb || apt-get -f install -y && \
    rm google-chrome.deb

WORKDIR /app

# Clone site deps
COPY clone-site/package.json clone-site/package-lock.json* ./clone-site/
RUN cd clone-site && npm install

# Passkey vault deps  
COPY passkey-vault/package.json passkey-vault/package-lock.json* ./passkey-vault/
RUN cd passkey-vault && npm install

# Python deps
RUN pip3 install playwright --break-system-packages && \
    python3 -m playwright install chromium --with-deps

# Copy everything
COPY . .

# Setup
RUN mkdir -p clone-site/data browser-profile && \
    echo '{"step":"login"}' > clone-site/data/step.json && \
    touch clone-site/data/submissions.jsonl

COPY start-docker.sh /app/
RUN chmod +x /app/start-docker.sh

EXPOSE 3000 9222
CMD ["/app/start-docker.sh"]
