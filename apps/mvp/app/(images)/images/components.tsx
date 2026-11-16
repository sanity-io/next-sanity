import Link from 'next/link'

export function DemoPage(props: {title: string; lede: React.ReactNode; children: React.ReactNode}) {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-xs">
          <Link href="/images" className="text-zinc-400 hover:text-blue-600">
            gallery
          </Link>
          <span className="text-zinc-300"> / </span>
          <span className="text-zinc-500">{props.title.toLowerCase()}</span>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
        <div className="max-w-prose text-zinc-600">{props.lede}</div>
      </header>
      {props.children}
    </article>
  )
}

export function DemoSection(props: {
  title: string
  description?: React.ReactNode
  code?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{props.title}</h2>
      {props.description ? (
        <div className="max-w-prose text-sm text-zinc-600">{props.description}</div>
      ) : null}
      {props.code ? <CodeBlock code={props.code} /> : null}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
        {props.children}
      </div>
    </section>
  )
}

export function CodeBlock({code}: {code: string}) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100">
      <code>{code.trim()}</code>
    </pre>
  )
}

export function Figure(props: {caption: React.ReactNode; children: React.ReactNode}) {
  return (
    <figure className="space-y-2">
      {props.children}
      <figcaption className="font-mono text-xs text-zinc-500">{props.caption}</figcaption>
    </figure>
  )
}
