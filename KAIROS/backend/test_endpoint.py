from app import create_app
import io

app = create_app()

with app.test_client() as client:
    print("Testing POST /api/ai/analyze-leaf")
    # We need an image. We can create a dummy 300x300 image
    from PIL import Image
    img = Image.new('RGB', (300, 300), color = 'green')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    # We need to simulate the user being authenticated.
    # KAIROS typically uses JWT. We can mock require_auth.
    # Instead of mocking, let's just temporarily bypass or use a mock token.
    # Actually, we can just patch require_auth for the test.
    import app.utils.auth
    def mock_require_auth(f):
        def wrapper(*args, **kwargs):
            from flask import request
            request.user_id = 1
            return f(*args, **kwargs)
        # Hack to bypass it on existing routes is hard since they are already wrapped.
        return wrapper
    
    # So instead, let's generate a valid token.
    import jwt
    from config import Config
    import datetime
    token = jwt.encode({
        'sub': 1,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, Config.SECRET_KEY, algorithm='HS256')
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    data = {
        'image': (io.BytesIO(img_bytes), 'leaf.jpg'),
        'farm_id': 1
    }
    
    response = client.post('/api/ai/analyze-leaf', data=data, headers=headers, content_type='multipart/form-data')
    print("Status:", response.status_code)
    try:
        print("JSON:", response.json)
    except:
        print("Text:", response.text)
