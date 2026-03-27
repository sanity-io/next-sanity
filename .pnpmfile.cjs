function readPackage(pkg) {
  if (pkg.name === 'follow-redirects') {
    delete pkg.peerDependenciesMeta
  }
  return pkg
}
module.exports = { hooks: { readPackage } }
