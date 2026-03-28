FROM node:lts-buster

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Start the bot
CMD ["npm", "start"]
