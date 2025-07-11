const styles: Record<'outer' | 'inner', React.CSSProperties> = {
  outer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    background: '#fff',
    zIndex: 1,
  },
  inner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    fontFamily: 'helvetica, arial, sans-serif',
  },
}

/** @internal */
export const NextStudioNoScript = (): React.JSX.Element => (
  <noscript>
    <div style={styles.outer}>
      <div style={styles.inner}>
        <h1>JavaScript disabled</h1>
        <p>
          Please <a href="https://www.enable-javascript.com/">enable JavaScript</a> in your browser
          and reload the page to proceed.
        </p>
      </div>
    </div>
  </noscript>
)
