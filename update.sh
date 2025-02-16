#!/bin/bash
cd /home/ubuntu/key_logger/KeyloggerProject-
git fetch origin main
git reset --hard origin/main
source /home/ubuntu/key_logger/venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart KeyLogger_flask_app
sudo systemctl status KeyLogger_flask_app

