"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Key, Link } from "lucide-react"
import type { TableSchema, FieldSchema, FieldType } from "@/lib/appContext/app-context"

interface TableEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: TableSchema | null
  onSave: (table: TableSchema) => void
}

const FIELD_TYPES: FieldType[] = [
  'Text', 'Textarea', 'Number', 'Decimal', 'Email',
  'Password', 'Date', 'DateTime', 'Boolean',
  'JSON', 'File', 'UUID', 'Enum'
]

export function TableEditDialog({ open, onOpenChange, table, onSave }: TableEditDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FieldSchema[]>([])

  useEffect(() => {
    if (table) {
      setName(table.name)
      setDescription(table.description || '')
      setFields([...table.fields])
    }
  }, [table])

  const handleAddField = () => {
    const newField: FieldSchema = {
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      type: 'Text',
      isPrimary: false,
      isRequired: false,
      isUnique: false,
      isForeignKey: false,
      description: ''
    }
    setFields([...fields, newField])
  }

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FieldSchema>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }

  const handleSave = () => {
    if (!table) return

    const updatedTable: TableSchema = {
      ...table,
      name,
      description,
      fields,
      updatedAt: new Date()
    }

    onSave(updatedTable)
    onOpenChange(false)
  }

  if (!table) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>
            Modify table properties and fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Table Name</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter table name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-description">Description</Label>
            <Textarea
              id="table-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter table description"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddField}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={field.name}
                      onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                      placeholder="Field name"
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) => handleUpdateField(field.id, { type: value as FieldType })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-primary`}
                        checked={field.isPrimary}
                        onCheckedChange={(checked) => 
                          handleUpdateField(field.id, { isPrimary: checked as boolean })
                        }
                      />
                      <label htmlFor={`${field.id}-primary`} className="text-sm flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Primary
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-required`}
                        checked={field.isRequired}
                        onCheckedChange={(checked) => 
                          handleUpdateField(field.id, { isRequired: checked as boolean })
                        }
                      />
                      <label htmlFor={`${field.id}-required`} className="text-sm">
                        Required
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-unique`}
                        checked={field.isUnique}
                        onCheckedChange={(checked) => 
                          handleUpdateField(field.id, { isUnique: checked as boolean })
                        }
                      />
                      <label htmlFor={`${field.id}-unique`} className="text-sm">
                        Unique
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-fk`}
                        checked={field.isForeignKey}
                        onCheckedChange={(checked) => 
                          handleUpdateField(field.id, { isForeignKey: checked as boolean })
                        }
                      />
                      <label htmlFor={`${field.id}-fk`} className="text-sm flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        Foreign Key
                      </label>
                    </div>
                  </div>

                  <Input
                    value={field.description || ''}
                    onChange={(e) => handleUpdateField(field.id, { description: e.target.value })}
                    placeholder="Field description (optional)"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
