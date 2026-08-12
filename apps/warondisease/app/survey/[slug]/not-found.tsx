import { ROUTES } from '@/lib/routes'
import { Sentry404Reporter } from '@/components/sentry-404-reporter'

export default function SurveyNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Sentry404Reporter />
      <div className="max-w-2xl text-center">
        <div className="bg-brutal-yellow border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-6 text-foreground">
            SURVEY NOT <span className="text-background">FOUND</span>
          </h1>
          <p className="text-lg font-bold text-foreground mb-8">
            THIS SURVEY PAGE DOES NOT EXIST OR HAS NOT BEEN APPROVED YET.
          </p>
          <div className="space-y-4">
            <p className="font-bold text-foreground">
              IF YOU'RE A PARTNER ORGANIZATION, YOUR APPLICATION MAY STILL BE UNDER REVIEW.
            </p>
            <div className="pt-4">
              <a
                href={ROUTES.institutes}
                className="inline-block bg-foreground text-background border-4 border-primary hover:bg-background hover:text-foreground font-black uppercase px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                BACK TO INSTITUTES
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
