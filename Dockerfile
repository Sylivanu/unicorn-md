FROM quay.io/gurusensei/gurubhay@sha256:f0aa7642b87487b22e00df87c1af064eeff00271f203eadab4d165b58c844787

WORKDIR /root/unicorn/

COPY package*.json ./

# Install the exact dependency tree recorded in package-lock.json.
RUN npm ci --platform=linuxmusl --legacy-peer-deps

COPY . ./

EXPOSE 3000

CMD ["npm", "start"]
