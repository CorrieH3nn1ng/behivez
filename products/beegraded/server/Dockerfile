FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY prisma ./prisma/
RUN npx prisma generate

COPY dist/ ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]
