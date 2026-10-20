import { ChevronDown, Download } from "lucide-react"
import Image from "next/image"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import socialImages from "@/lib/social-images.json"

// Rendered by design/social/render.mjs: a PNG to download and a WebP thumbnail for each size.
const FOLDER = "/assets/acceleratedmedicine/social"

type SocialImage = (typeof socialImages)[number]

function ShareImage({ image }: { image: SocialImage }) {
  return (
    <li className="flex flex-col rounded-lg border bg-background p-4">
      <div className="flex h-44 items-center justify-center rounded-md bg-muted p-3">
        <Image
          alt={`${image.title}: the initiative's name, its goal and the four-step loop`}
          className="max-h-full w-auto rounded-sm object-contain shadow-sm"
          height={image.height}
          src={`${FOLDER}/thumbs/${image.file}.webp`}
          width={image.width}
        />
      </div>
      <h4 className="mt-4 font-semibold">{image.title}</h4>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">
        {image.width} × {image.height} · {image.use}
      </p>
      <Button asChild className="mt-4 self-start" variant="outline">
        <a download={`acceleratedmedicine-${image.file}.png`} href={`${FOLDER}/${image.file}.png`}>
          <Download aria-hidden="true" className="mr-2 h-4 w-4" /> Download
        </a>
      </Button>
    </li>
  )
}

const GROUPS = [
  { kind: "post", title: "Posts" },
  { kind: "header", title: "Profile headers and covers" },
]

/** The share images, closed by default so the page leads with the presentations. The thumbnails load when opened. */
export function ShareImages() {
  return (
    <details className="group mx-auto mb-12 max-w-5xl rounded-lg border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold">
          Images for social media <span className="whitespace-nowrap">({socialImages.length} sizes)</span>
        </h2>
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t p-5">
        {GROUPS.map(group => (
          <div className="mb-8 last:mb-0" key={group.kind}>
            <h3 className="font-semibold text-muted-foreground">{group.title}</h3>
            <ul className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {socialImages.filter(image => image.kind === group.kind).map(image => (
                <ShareImage image={image} key={image.file} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}
