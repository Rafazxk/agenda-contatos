from django.db import models
from django.contrib.auth.models import User 


class Contato(models.Model):
    # rf01: Campos obrigatorios para o registro
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    
    # RF01 e RF02: Frequência de contato desejada
    OPCOES_FREQUENCIA = [
        ('semanal', 'Semanal'),
        ('quinzenal', 'Quinzenal'),
        ('mensal', 'Mensal'),
    ]
    
    frequencia = models.CharField(
        max_length=10,
        choices=OPCOES_FREQUENCIA,
        default='mensal'
    )

   
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contatos')

    def __str__(self):
        return self.nome