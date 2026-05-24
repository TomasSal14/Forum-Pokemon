# PokeForum — Backend (Django)

## Requirements

- Python 3.12+

## Setup

**1. Create and activate the virtual environment**

macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Apply database migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

**4. Create an admin user**
```bash
python manage.py createsuperuser
```

**5. (Optional) Populate with test data**
```bash
python manage.py create_test_data
```

**6. Start the server**
```bash
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/`  
The Django admin panel is available at `http://127.0.0.1:8000/admin/`
