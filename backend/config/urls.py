from django.contrib import admin
from django.urls import include, path

from apps.corpus.api.views import ApiRootView

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),   # the server's home page: an index of the API
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.corpus.api.urls")),
]
