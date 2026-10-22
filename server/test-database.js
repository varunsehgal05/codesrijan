// Test runners must opt into a disposable, local database explicitly.
export function requireTestDatabaseUri(uri = process.env.TEST_MONGO_URI) {
    let parsed;
    try { parsed = new URL(uri); } catch { throw new Error('Set TEST_MONGO_URI to a local mongodb:// URI with a test database.'); }
    if (parsed.protocol !== 'mongodb:' || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
        || parsed.username || parsed.password || !/^\/(?:test|codesrijan_test)[a-zA-Z0-9_-]*$/.test(parsed.pathname)
        || parsed.search || parsed.hash) {
        throw new Error('Refusing non-local or non-test MongoDB URI. Use a disposable local test database.');
    }
    return uri;
}
