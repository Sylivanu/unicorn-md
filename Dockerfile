FROM quay.io/gurusensei/gurubhay:latest

RUN git clone https://github.com/Sylivanu/unicorn-md /root/unicorn

WORKDIR /root/unicorn/

RUN npm install --platform=linuxmusl

EXPOSE 5000

CMD ["npm", "start"]
