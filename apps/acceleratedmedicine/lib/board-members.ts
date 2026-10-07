export type BoardMember = {
  name: string
  role: string
  photoSrc: string
  photoAlt: string
}

export const BOARD_MEMBERS: BoardMember[] = [
  {
    name: "Mike Sinn",
    role: "President",
    photoSrc: "/assets/acceleratedmedicine/board/mike-sinn.jpg",
    photoAlt: "Cartoon portrait of Mike Sinn",
  },
  {
    name: "Ian Whitmore",
    role: "Treasurer",
    photoSrc: "/assets/acceleratedmedicine/board/ian-whitmore.jpg",
    photoAlt: "Cartoon portrait of Ian Whitmore",
  },
  {
    name: "Kathryn Bortko",
    role: "Secretary",
    photoSrc: "/assets/acceleratedmedicine/board/kathryn-bortko.jpg",
    photoAlt: "Cartoon portrait of Kathryn Bortko",
  },
]
