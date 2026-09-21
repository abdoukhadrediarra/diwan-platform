from django.urls import path

from .views import CorpusView, DiwanDetailView, DiwanListView, PoemDetailView, SearchView

urlpatterns = [
    path("corpus/", CorpusView.as_view(), name="api-corpus"),
    path("diwans/", DiwanListView.as_view(), name="api-diwans"),
    path("diwans/<slug:diwan>/", DiwanDetailView.as_view(), name="api-diwan"),
    path("diwans/<slug:diwan>/poems/<slug:poem>/", PoemDetailView.as_view(), name="api-poem"),
    path("search/", SearchView.as_view(), name="api-search"),
]
