/* eslint-disable react/no-danger */

const style = {
  __html: `
.sanity-app-no-js__root {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: #fff;
  z-index: 1;
}

.sanity-app-no-js__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: helvetica, arial, sans-serif;
}
`,
} as const

/** @alpha */
export const NextStudioNoScript = () => (
  <noscript>
    <div className="sanity-app-no-js__root">
      <div className="sanity-app-no-js__content">
        <style type="text/css" dangerouslySetInnerHTML={style} />
        <h1>JavaScript disabled</h1>
        <p>
          Please <a href="https://www.enable-javascript.com/">enable JavaScript</a> in your
          browser and reload the page to proceed.
        </p>
      </div>
    </div>
  </noscript>
)
