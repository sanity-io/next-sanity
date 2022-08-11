/* eslint-disable no-console */
// Removes deps to peerDependencies that we consider optional but parcel requires to be defined
// Only intended to run as part of the semantic-release workflow

const path = require('path')
const writeFileAtomic = require('write-file-atomic')

async function main() {
  try {
    console.group('postParcel')
    const pkg = require('../package.json')
    console.log('Modifying...')
    const reactPeerDependency = pkg.peerDependencies.react
    pkg.peerDependencies = {
      react: reactPeerDependency,
    }
    console.log('Writing package.json...')
    await writeFileAtomic(
      path.resolve(__dirname, '../package.json'),
      JSON.stringify(pkg, null, 2),
      'utf8'
    )
    console.log('Finished!')
  } finally {
    console.groupEnd()
  }
}

main().catch((err) => {
  console.error(err)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
