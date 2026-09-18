export type BoardMember = {
  name: string
  role: string
  photoSrc: string
  photoAlt: string
  photoClassName: string
}

export const BOARD_MEMBERS: BoardMember[] = [
  {
    name: "Mike Sinn",
    role: "President",
    photoSrc: "/assets/acceleratedmedicine/board/mike-sinn.jpg?v=2",
    photoAlt: "Cartoon portrait of Mike Sinn",
    photoClassName: "bg-brutal-cyan",
  },
  {
    name: "Ian Whitmore",
    role: "Treasurer",
    photoSrc: "/assets/acceleratedmedicine/board/ian-whitmore.jpg",
    photoAlt: "Cartoon portrait of Ian Whitmore",
    photoClassName: "bg-brutal-yellow",
  },
  {
    name: "Kathryn Bortko",
    role: "Secretary",
    photoSrc: "/assets/acceleratedmedicine/board/kathryn-bortko.jpg?v=4",
    photoAlt: "Cartoon portrait of Kathryn Bortko",
    photoClassName: "bg-brutal-pink",
  },
]
