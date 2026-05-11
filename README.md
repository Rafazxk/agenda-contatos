##  configurações

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Rafazxk/agenda-contatos.git
   cd agenda
   ```

2. **Configure o ambiente virtual:**

   ```bash 
   python -m venv .venv
   source .venv/bin/activate  
   pip install -r requirements.txt
   ```

3. **Configure as variáveis de ambiente:** 

   ```bash
   1. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
   2. Crie um banco de dados PostgreSQL na sua máquina.
   3. Preencha as credenciais no arquivo `.env` recém-criado.
   ```

4. **Prepare o banco de dados:**
    ```bash
    python manage.py migrate
    ```

5. **Inicie o servidor:**

    ```bash
    python manage.py runserver
    ```
    
