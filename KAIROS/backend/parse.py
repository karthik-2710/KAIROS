
import json
with open('debug_out.json') as f:
    d = json.load(f)

for entry in reversed(d.get('data', [])):
    outputs = entry.get('outputs', {})
    default_out = outputs.get('default', {})
    cloud_out = outputs.get('cloudMask', {})
    stats = default_out.get('bands', {}).get('B0', {}).get('stats', {})
    cloud_stats = cloud_out.get('bands', {}).get('B0', {}).get('stats', {})
    sample_count = stats.get('sampleCount', 0)
    no_data_count = stats.get('noDataCount', 0)
    valid_pixels = sample_count - no_data_count
    mean = stats.get('mean')
    cloud_mean = cloud_stats.get('mean')
    print('Interval:', entry.get('interval', {}).get('from'), 'Valid:', valid_pixels, 'Mean:', mean, 'CloudMean:', cloud_mean)

