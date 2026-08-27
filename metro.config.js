const { getSentryExpoConfig } = require('@sentry/react-native/metro')

const config = getSentryExpoConfig(__dirname)

// expo-sqlite's web implementation loads a wa-sqlite WASM build and needs
// cross-origin isolation (SharedArrayBuffer) to run — only required for
// the web target; native iOS/Android builds don't need this.
config.resolver.assetExts.push('wasm')

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    return middleware(req, res, next)
  }
}

module.exports = config
