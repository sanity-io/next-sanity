/* eslint-disable no-console */
// Adds deps to peerDependencies that we consider optional but parcel requires to be defined
// Only intended to run as part of the semantic-release workflow

const path = require('path')
const writeFileAtomic = require('write-file-atomic')

async function main() {
  try {
    console.group('preParcel')
    const pkg = require('../package.json')
    console.log('Modifying...')
    Object.assign(pkg.peerDependencies, {
      next: pkg.devDependencies.next,
      sanity: pkg.devDependencies.sanity,
      'styled-components': pkg.devDependencies['styled-components'],
    })
    console.log('Writing package.json...')
    await writeFileAtomic(
      path.resolve(__dirname, '../package.json'),
      // eslint-disable-next-line prefer-template
      JSON.stringify(pkg, null, 2) + '\n',
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
