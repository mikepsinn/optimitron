"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, ExternalLink, Trash2, Edit, GripVertical, Link as LinkIcon } from "lucide-react"
import { addUserLink, updateUserLink, deleteUserLink, reorderUserLinks } from "../../actions"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

interface UserLink {
  id: string
  title: string
  url: string
  description: string | null
  imageUrl: string | null
  order: number
}

interface LinksSectionProps {
  initialLinks: UserLink[]
}

export function LinksSection({ initialLinks }: LinksSectionProps) {
  const [links, setLinks] = useState<UserLink[]>(initialLinks)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<UserLink | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    imageUrl: "",
  })

  const resetForm = () => {
    setForm({ title: "", url: "", description: "", imageUrl: "" })
    setEditingLink(null)
  }

  const handleAdd = () => {
    if (!form.title.trim() || !form.url.trim()) return

    startTransition(() => {
      addUserLink({
        title: form.title,
        url: form.url,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
      })
        .then((result) => {
          setLinks([...links, result.link])
          setIsAddOpen(false)
          resetForm()
        })
        .catch((error) => {
          console.error("Failed to add link:", error)
        })
    })
  }

  const handleEdit = () => {
    if (!editingLink || !form.title.trim() || !form.url.trim()) return

    startTransition(() => {
      updateUserLink(editingLink.id, {
        title: form.title,
        url: form.url,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
      })
        .then(() => {
          setLinks(
            links.map((link) =>
              link.id === editingLink.id
                ? {
                    ...link,
                    title: form.title,
                    url: form.url,
                    description: form.description || null,
                    imageUrl: form.imageUrl || null,
                  }
                : link
            )
          )
          resetForm()
        })
        .catch((error) => {
          console.error("Failed to update link:", error)
        })
    })
  }

  const handleDelete = (linkId: string) => {
    startTransition(() => {
      deleteUserLink(linkId)
        .then(() => {
          setLinks(links.filter((link) => link.id !== linkId))
        })
        .catch((error) => {
          console.error("Failed to delete link:", error)
        })
    })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(links)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setLinks(items)

    // Update order in database
    startTransition(() => {
      reorderUserLinks(items.map((item) => item.id)).catch((error) => {
        console.error("Failed to reorder links:", error)
      })
    })
  }

  const openEditDialog = (link: UserLink) => {
    setEditingLink(link)
    setForm({
      title: link.title,
      url: link.url,
      description: link.description || "",
      imageUrl: link.imageUrl || "",
    })
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black uppercase">Your Links</CardTitle>
            <CardDescription className="font-bold">
              Share your portfolio, social media, and more
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="border-2 border-primary bg-brutal-yellow font-bold uppercase"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-primary">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase">Add New Link</DialogTitle>
                <DialogDescription className="font-bold">
                  Add a custom link to your profile
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-bold uppercase">Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="My Portfolio"
                    className="border-2 border-primary"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold uppercase">URL</Label>
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                    className="border-2 border-primary"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold uppercase">Description (Optional)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="A brief description..."
                    rows={2}
                    className="border-2 border-primary"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold uppercase">Image URL (Optional)</Label>
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    className="border-2 border-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={isPending || !form.title.trim() || !form.url.trim()}
                  className="border-2 border-primary bg-brutal-pink font-bold uppercase"
                >
                  {isPending ? "Adding..." : "Add Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-primary rounded-lg bg-muted/20">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-bold mb-2">No links yet</p>
            <p className="text-sm text-muted-foreground">
              Add links to share your online presence
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="links">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {links.map((link, index) => (
                    <Draggable key={link.id} draggableId={link.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-2 border-primary rounded-lg p-4 bg-background ${
                            snapshot.isDragging ? "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{link.title}</h3>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brutal-pink hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono truncate">
                                {link.url}
                              </p>
                              {link.description && (
                                <p className="text-sm mt-2">{link.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Dialog
                                open={editingLink?.id === link.id}
                                onOpenChange={(open) => {
                                  if (!open) resetForm()
                                  else openEditDialog(link)
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-2 border-primary"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-2 border-primary">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-black uppercase">
                                      Edit Link
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-bold uppercase">Title</Label>
                                      <Input
                                        value={form.title}
                                        onChange={(e) =>
                                          setForm({ ...form, title: e.target.value })
                                        }
                                        className="border-2 border-primary"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-bold uppercase">URL</Label>
                                      <Input
                                        value={form.url}
                                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                                        type="url"
                                        className="border-2 border-primary"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-bold uppercase">
                                        Description
                                      </Label>
                                      <Textarea
                                        value={form.description}
                                        onChange={(e) =>
                                          setForm({ ...form, description: e.target.value })
                                        }
                                        rows={2}
                                        className="border-2 border-primary"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-bold uppercase">
                                        Image URL
                                      </Label>
                                      <Input
                                        value={form.imageUrl}
                                        onChange={(e) =>
                                          setForm({ ...form, imageUrl: e.target.value })
                                        }
                                        type="url"
                                        className="border-2 border-primary"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={handleEdit}
                                      disabled={isPending || !form.title.trim() || !form.url.trim()}
                                      className="border-2 border-primary bg-brutal-pink font-bold uppercase"
                                    >
                                      {isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(link.id)}
                                disabled={isPending}
                                className="border-2 border-primary hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  )
}
