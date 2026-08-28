import urllib.request
import json
import urllib.parse

crops = {
    'Rice': ['Paddy(Dhan)(Common)', 'Rice', 'Paddy(Dhan)(Basmati)'],
    'Soybean': ['Soyabean', 'Soybean'],
    'Cotton': ['Cotton', 'Kapas'],
    'Wheat': ['Wheat', 'Wheat(Atta)'],
    'Onion': ['Onion', 'Green Onion'],
    'Banana': ['Banana', 'Banana - Green'],
    'Orange': ['Mousambi(Sweet Lime)', 'Orange', 'Santra'],
    'Bajra': ['Bajra(Pearl Millet/Cumbu)', 'Bajra'],
    'Jowar': ['Jowar(Sorghum)', 'Jowar'],
    'Sugarcane': ['Sugarcane', 'Gur(Jaggery)']
}

print("Querying Government of India AGMARKNET API (data.gov.in)...")

for crop, terms in crops.items():
    found = False
    for term in terms:
        params = {
            'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
            'format': 'json',
            'filters[state]': 'Maharashtra',
            'filters[commodity]': term
        }
        query_string = urllib.parse.urlencode(params)
        url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?{query_string}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                recs = data.get('records', [])
                if recs:
                    print(f"[OK] {crop:10} -> '{term}': {len(recs)} mandis in Maharashtra (Total records: {data.get('total')})")
                    print(f"     Example: {recs[0]['market']} ({recs[0]['district']}) | Min: ₹{recs[0]['min_price']} | Max: ₹{recs[0]['max_price']} | Modal: ₹{recs[0]['modal_price']} / quintal | Date: {recs[0]['arrival_date']}")
                    found = True
                    break
        except Exception as e:
            print(f"     Error querying {term}: {e}")
    if not found:
        # Also query national if not found in Maharashtra
        params_all = {
            'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
            'format': 'json',
            'filters[commodity]': terms[0]
        }
        query_all = urllib.parse.urlencode(params_all)
        url_all = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?{query_all}"
        req_all = urllib.request.Request(url_all, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req_all, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                recs = data.get('records', [])
                if recs:
                    print(f"[NATIONAL] {crop:10} -> '{terms[0]}': Found {len(recs)} mandis across India (e.g., {recs[0].get('state')})")
                else:
                    print(f"[NO DATA]  {crop:10} -> No mandis found today.")
        except Exception:
            print(f"[NO DATA]  {crop:10}")
