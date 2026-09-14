#!/usr/bin/env bash
# Build command for the hosting service (Render, Railway…): run from the backend/ folder.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input      # the admin's CSS and JS
python manage.py migrate                       # create or update the tables
python manage.py seed_diwans                   # the 7 diwans with their titles and figures
python manage.py ensure_superuser              # only if the DJANGO_SUPERUSER_* variables are set
