FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Fix permission for react-scripts binary inside container
RUN chmod +x node_modules/.bin/*

EXPOSE 3000

CMD ["npm", "start"]
