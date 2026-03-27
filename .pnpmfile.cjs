function readPackage(pkg) {
  // @TODO fix upstream: get-it should inline follow-redirects
  if (pkg.name === 'follow-redirects') {
    delete pkg.peerDependenciesMeta
  }
  // @TODO fix upstream: @sanity/cli and @sanity/cli-core should use the same
  // @sanity/telemetry range as sanity (^0.9.0), not ^0.8.1 / >=0.8.1 <0.9.0
  if (pkg.name === '@sanity/cli-core' && pkg.peerDependencies?.['@sanity/telemetry']) {
    pkg.peerDependencies['@sanity/telemetry'] = '^0.9.0'
  }
  if (pkg.name === '@sanity/cli' && pkg.dependencies?.['@sanity/telemetry']) {
    pkg.dependencies['@sanity/telemetry'] = '^0.9.0'
  }
  return pkg
}
module.exports = { hooks: { readPackage } }
