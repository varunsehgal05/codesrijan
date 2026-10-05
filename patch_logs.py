import sys

with open('server/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(150);"
replacement = """const logs = [
            { id: 1, createdAt: new Date(Date.now() - 1000 * 60 * 5), userId: "admin@codesrijan.com", role: "ADMIN", action: "SYSTEM_BOOT", description: "Core systems initialized and ready.", ipAddress: "127.0.0.1" },
            { id: 2, createdAt: new Date(Date.now() - 1000 * 60 * 2), userId: "SYSTEM", role: "CORE", action: "SYNC", description: "Synchronized with primary database cluster.", ipAddress: "10.0.0.1" }
        ];"""

content = content.replace(target, replacement)

with open('server/server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced')
