# Pokeforum — Backend (Django)

## Requisitos

- Python 3.12+

## Instalação

**1. Criar e ativar o ambiente virtual**
```
python/py -m venv venv
source venv\Scripts\activate
```

**2. Instalar dependências**
```
pip install -r requirements.txt
```

**3. Criar a base de dados**
```
python/py manage.py makemigrations
python/py manage.py migrate
```

**4. Criar utilizador administrador**
```
python/py manage.py createsuperuser
```

**5. (Opcional) Popular com dados de teste**
```
python/py manage.py create_test_data
```

**6. Arrancar o servidor**
```
python/py manage.py runserver
```

O servidor fica disponível em `http://127.0.0.1:8000/`  
O backoffice fica disponível em `http://127.0.0.1:8000/admin/`
