import type { SVGProps } from 'react'

const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.1a8 8 0 0 1 13.4 3M4.5 14.9a8 8 0 0 0 13.4 3" /></>,
  crop: <><path d="M6 3v15h15M3 6h15v15M3 21 21 3" /></>,
  settings: <><path d="m9 3-.6 2.2-2 1.2-2.2-.6-2 3.4 1.6 1.7v2.2l-1.6 1.7 2 3.4 2.2-.6 2 1.2L9 21h4l.6-2.2 2-1.2 2.2.6 2-3.4-1.6-1.7v-2.2l1.6-1.7-2-3.4-2.2.6-2-1.2L13 3Z" /><circle cx="11" cy="12" r="3" /></>,
  maximize: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />,
  minimize: <path d="M3 8h5V3M21 8h-5V3M16 21v-5h5M8 21v-5H3" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01" /></>,
  grip: <><circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="m12 3 10 18H2L12 3ZM12 9v5M12 17h.01" /></>,
} as const

export type IconName = keyof typeof paths
/** Decorative icons: the containing button supplies its accessible name. */
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>
}
