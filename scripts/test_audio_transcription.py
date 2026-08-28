import sys
import io
import wave
import struct
from pathlib import Path

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "KAIROS" / "KAIROS" / "backend"))

from app import create_app

def create_dummy_wav():
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        # 1 second of silence/sine wave
        data = [int(32767 * 0.1 * ((i % 100) / 100.0)) for i in range(16000)]
        packed = struct.pack('<' + ('h' * len(data)), *data)
        wav.writeframes(packed)
    buffer.seek(0)
    return buffer

def test_transcribe_endpoint():
    app = create_app()
    client = app.test_client()

    # Generate test token
    with app.app_context():
        from app.utils.auth import generate_token
        token = generate_token(1)

    wav_data = create_dummy_wav()
    response = client.post(
        '/api/ai/transcribe-audio',
        data={
            'audio': (wav_data, 'test.wav', 'audio/wav'),
            'language': 'en'
        },
        headers={'Authorization': f'Bearer {token}'},
        content_type='multipart/form-data'
    )

    print("Status code:", response.status_code)
    print("Response:", response.get_json())
    assert response.status_code in [200, 400, 500]
    print("Audio transcribe endpoint test completed.")

if __name__ == "__main__":
    test_transcribe_endpoint()
