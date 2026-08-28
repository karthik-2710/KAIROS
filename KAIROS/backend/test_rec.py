from app import create_app
import json

app = create_app()
with app.test_client() as client:
    from app.utils.auth import generate_token
    token = generate_token(1)
    resp = client.get('/recommendation?farm_id=1', headers={'Authorization': 'Bearer ' + token})
    print('STATUS:', resp.status_code)
    data = json.loads(resp.data.decode('utf-8'))
    print(json.dumps(data, indent=2))
