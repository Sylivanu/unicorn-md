FROM quay.io/gurusensei/gurubhay:latest

RUN git clone https://github.com/Sylivanu/unicorn-md /root/unicorn

WORKDIR /root/unicorn/

# Install with legacy peer deps to handle version conflicts
RUN npm install --platform=linuxmusl --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
