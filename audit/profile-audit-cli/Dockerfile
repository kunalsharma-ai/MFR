FROM node:24-alpine AS development

WORKDIR /src

COPY ./package.json .

RUN npm install 

CMD [ "tail","-f","/dev/null" ]