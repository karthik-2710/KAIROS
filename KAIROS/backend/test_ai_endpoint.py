import io
from app import create_app
from app.database.db import init_db
from app.utils.auth import generate_token

app = create_app()
app.config['TESTING'] = True

with app.app_context():
    init_db()
    # Generate a token with a random user id
    token = generate_token(1)
    
    client = app.test_client()
    
    # Create a dummy image
    from PIL import Image
    image = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    data = {
        'image': (img_byte_arr, 'test.png'),
        'farm_id': '1'
    }
    
    print("Sending POST request to /ai/analyze-leaf...")
    response = client.post(
        '/ai/analyze-leaf',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print("Status Code:", response.status_code)
    print("Response:", response.get_json())
    
    if response.status_code == 200:
        print("Test completed successfully.")
    else:
        print("Test failed.")
