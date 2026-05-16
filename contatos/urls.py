from django.urls import path
from . import views

urlpatterns = [
    path('api/contatos/', views.listar_contatos_api, name='listar_contatos_api'),
    path('api/contatos/criar/', views.criar_contato_api, name='criar_contato_api'),

    path('api/contatos/editar/<int:id>/', views.editar_contatos_api, name='editar_contatos_api'),
    path('api/contatos/excluir/<int:id>/', views.excluir_contatos_api, name='excluir_contatos_api'),
] 