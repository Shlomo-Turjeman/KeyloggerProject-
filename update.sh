#!/bin/bash
cd /home/ubuntu/key_logger
git fetch origin main
git reset --hard origin/main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart flask_app
