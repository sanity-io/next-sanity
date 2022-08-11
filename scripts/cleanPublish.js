/* eslint-disable no-console */
// Cleans the package json from unnecessary fields before publishing to npm
// Only intended to run as part of the semantic-release workflow

const path = require('path')
const writeFileAtomic = require('write-file-atomic')

async function main() {
  console.log('Reading package.json')
  const {
    // Only react is a peer dependency we require, the others are there to avoid parcel throwing errors on imports not specified in deps
    peerDependencies: {react: reactPeerDependency},
    ...pkg
  } = require('../package.json')
  console.log('Modifying...')
  const modifiedPkg = {...pkg, peerDependencies: {react: reactPeerDependency}}
  console.log('Writing package.json...')
  await writeFileAtomic(
    path.resolve(__dirname, '../package.json'),
    JSON.stringify(modifiedPkg, null, 2),
    'utf8'
  )
  console.log('Finished!')
}

main().catch((err) => {
  console.error(err)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
