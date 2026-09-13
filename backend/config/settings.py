"""
Django settings for the Diwan backend. Values come from environment variables, with local defaults.

    DJANGO_SECRET_KEY, DJANGO_DEBUG (1/0), DJANGO_ALLOWED_HOSTS (comma separated; required when DEBUG is off)
    DATABASE_URL (postgres://… ; used instead of the DB_* variables when set — the hosts provide it)
    CORS_ALLOWED_ORIGINS (comma separated: where the website is served from, for the front-end team)
    DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
    CORPUS_AUTO_PUBLISH (1/0): publish reviewed poems as soon as they are imported
"""
import mimetypes
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Some Windows PCs register .css and .js as "text/plain"; browsers then refuse the admin's stylesheets and
# scripts, and the admin looks unstyled. Force the right types whatever the computer says.
mimetypes.add_type("text/css", ".css", True)
mimetypes.add_type("text/javascript", ".js", True)

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
# Which addresses the server answers to. Django replies "400 Bad Request" to any other one.
# In development we accept them all, so the Android emulator (10.0.2.2) and a real phone on the
# same Wi-Fi (192.168.x.x) can reach the API. In production, set DJANGO_ALLOWED_HOSTS to your domain.
_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in _hosts.split(",") if h.strip()] or (["*"] if DEBUG else [])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",   # static files served by WhiteNoise, also with runserver
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "corsheaders",
    "apps.corpus",
    "apps.exports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",   # serves the admin's CSS/JS with correct types, DEBUG on or off
    "corsheaders.middleware.CorsMiddleware",       # lets the website call the API from another address
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"

if not DEBUG and not os.environ.get("DATABASE_URL"):
    # a clear message instead of "connection to 127.0.0.1 refused" during a deploy
    raise ImproperlyConfigured(
        "DATABASE_URL is not set. On the hosting service, add the connection string of your "
        "PostgreSQL database (Neon, Supabase, Render) as an environment variable named DATABASE_URL."
    )

if os.environ.get("DATABASE_URL"):          # hosting services give the database as one address
    import dj_database_url

    DATABASES = {"default": dj_database_url.config(conn_max_age=600, ssl_require=not DEBUG)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "diwan"),
            "USER": os.environ.get("DB_USER", "diwan"),
            "PASSWORD": os.environ.get("DB_PASSWORD", "01022001"),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }

LANGUAGE_CODE = "fr"
TIME_ZONE = "Africa/Dakar"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"      # production: python manage.py collectstatic
WHITENOISE_USE_FINDERS = True               # also serve straight from the apps, so it works before collectstatic
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
DATA_UPLOAD_MAX_NUMBER_FILES = 500

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer", "rest_framework.renderers.BrowsableAPIRenderer"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],   # the API is read-only
    "UNICODE_JSON": True,
}

CORPUS_AUTO_PUBLISH = os.environ.get("CORPUS_AUTO_PUBLISH", "1") == "1"

# --- when the API is online -------------------------------------------------------------------
# the API is read-only, so any site may read it; the admin stays protected by its login
CORS_ALLOW_ALL_ORIGINS = DEBUG or not os.environ.get("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS_ALLOW_METHODS = ["GET", "HEAD", "OPTIONS"]

# addresses allowed to post the admin forms (the site's own https address)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")   # the host terminates HTTPS
    SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SSL_REDIRECT", "1") == "1"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }
