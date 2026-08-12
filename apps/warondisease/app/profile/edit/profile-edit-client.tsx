"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Link as LinkIcon } from "lucide-react"
import { BasicInfoSection } from "./sections/basic-info-section"
import { LinksSection } from "./sections/links-section"

interface ProfileEditClientProps {
  initialData: Awaited<ReturnType<typeof import("../actions").getProfileData>>
}

export function ProfileEditClient({ initialData }: ProfileEditClientProps) {
  const [activeTab, setActiveTab] = useState("basic")

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-2">
              EDIT YOUR <span className="text-brutal-pink">PROFILE</span>
            </h1>
            <p className="text-lg font-bold text-muted-foreground">
              Manage your professional presence
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto border-2 border-primary bg-background p-1">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-brutal-pink data-[state=active]:text-white font-bold uppercase text-sm py-3 border-2 border-transparent data-[state=active]:border-primary"
              >
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="links"
                className="data-[state=active]:bg-brutal-yellow data-[state=active]:text-black font-bold uppercase text-sm py-3 border-2 border-transparent data-[state=active]:border-primary"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Links
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <BasicInfoSection initialData={initialData.user} />
            </TabsContent>

            <TabsContent value="links" className="mt-6">
              <LinksSection initialLinks={initialData.links} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  )
}
