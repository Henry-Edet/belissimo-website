#!/bin/bash
cd /var/app/staging
npm install --include=dev
./node_modules/.bin/nest build
