from django.db import models


class Contato(models.Model):
    # rf01: Campos obrigatorios para o registro
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    
    # RF01 e RF02: Frequência de contato desejada
    # escolhas fixas 
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

    def __str__(self):
        return self.nome