import re

# Read JavaScript file
with open('static/script.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Find all getElementById calls
ids_in_js = set(re.findall(r"getElementById\('([^']+)'\)", js_content))

# Read HTML file
with open('templates/index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Find all id= declarations
ids_in_html = set(re.findall(r'id="([^"]+)"', html_content))

missing = ids_in_js - ids_in_html
orphaned = ids_in_html - ids_in_js

if missing:
    print('❌ IDs used in JS but missing in HTML:')
    for id in sorted(missing):
        print(f'  - {id}')
else:
    print('✅ All JS IDs exist in HTML')

if orphaned:
    print('\n⚠️ IDs in HTML but not used in JS:')
    for id in sorted(orphaned)[:20]:
        print(f'  - {id}')
    if len(orphaned) > 20:
        print(f'  ... and {len(orphaned) - 20} more')
else:
    print('✅ No orphaned HTML IDs')

print(f'\nTotal unique IDs in JS: {len(ids_in_js)}')
print(f'Total unique IDs in HTML: {len(ids_in_html)}')
