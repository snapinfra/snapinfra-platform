"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProjectNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
  currentName?: string
  existingNames?: string[]
  mode?: "create" | "rename"
}

export function ProjectNameDialog({
  open,
  onOpenChange,
  onConfirm,
  currentName = "",
  existingNames = [],
  mode = "rename"
}: ProjectNameDialogProps) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setName(currentName)
      setError("")
    }
  }, [open, currentName])

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setError("Project name cannot be empty")
      return false
    }

    if (value.length < 3) {
      setError("Project name must be at least 3 characters")
      return false
    }

    if (value.length > 50) {
      setError("Project name must be less than 50 characters")
      return false
    }

    if (value.trim() !== currentName && existingNames.includes(value.trim())) {
      setError("A project with this name already exists")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateName(name)) {
      onConfirm(name.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Name Your Project" : "Rename Project"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Give your project a meaningful name to identify it easily."
              : "Enter a new name for your project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                onBlur={() => validateName(name)}
                placeholder="e.g., E-commerce Platform"
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!!error || !name.trim()}>
              {mode === "create" ? "Create" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
