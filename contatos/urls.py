from django.urls import path
from . import views

urlpatterns = [
    path('', views.listar_contatos_api, name='lista_contatos'),
    path('criar/', views.criar_contato_api, name='criar_contato')
]