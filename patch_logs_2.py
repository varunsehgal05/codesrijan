import sys
import re

with open('server/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = r"app\.get\('/api/admin/logs', requireAuth, requireAdmin, async \(req, res\) => \{.*?\n\}\);\s*"
content = re.sub(target, '', content, flags=re.DOTALL)

with open('server/server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Cleaned duplicate route')
