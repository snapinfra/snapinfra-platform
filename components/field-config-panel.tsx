"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Trash2, 
  Key, 
  Link, 
  Database, 
  Shield, 
  Hash,
  Calendar,
  FileText,
  Mail,
  Lock,
  CheckSquare,
  Code,
  Upload,
  List
} from "lucide-react"
import { FieldSchema, FieldType, ValidationRule } from "@/lib/appContext/app-context"

interface FieldConfigPanelProps {
  field?: FieldSchema
  onSave: (field: FieldSchema) => void
  onCancel: () => void
  existingFieldNames: string[]
  children: React.ReactNode
}

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'Text', label: 'Text', icon: <FileText className="w-4 h-4" />, description: 'Single line text' },
  { value: 'Textarea', label: 'Long Text', icon: <FileText className="w-4 h-4" />, description: 'Multi-line text' },
  { value: 'Number', label: 'Number', icon: <Hash className="w-4 h-4" />, description: 'Integer number' },
  { value: 'Decimal', label: 'Decimal', icon: <Hash className="w-4 h-4" />, description: 'Decimal number' },
  { value: 'Email', label: 'Email', icon: <Mail className="w-4 h-4" />, description: 'Email address' },
  { value: 'Password', label: 'Password', icon: <Lock className="w-4 h-4" />, description: 'Hashed password' },
  { value: 'Date', label: 'Date', icon: <Calendar className="w-4 h-4" />, description: 'Date only' },
  { value: 'DateTime', label: 'DateTime', icon: <Calendar className="w-4 h-4" />, description: 'Date and time' },
  { value: 'Boolean', label: 'Boolean', icon: <CheckSquare className="w-4 h-4" />, description: 'True/false value' },
  { value: 'JSON', label: 'JSON', icon: <Code className="w-4 h-4" />, description: 'JSON object' },
  { value: 'File', label: 'File', icon: <Upload className="w-4 h-4" />, description: 'File upload' },
  { value: 'UUID', label: 'UUID', icon: <Key className="w-4 h-4" />, description: 'Unique identifier' },
  { value: 'Enum', label: 'Options', icon: <List className="w-4 h-4" />, description: 'Predefined options' }
]

export function FieldConfigPanel({ field, onSave, onCancel, existingFieldNames, children }: FieldConfigPanelProps) {
  const [formData, setFormData] = useState<FieldSchema>(() => 
    field || {
      id: `field_${Date.now()}`,
      name: '',
      type: 'Text',
      isRequired: false,
      isUnique: false,
      isPrimary: false,
      isForeignKey: false,
      hasIndex: false,
      description: '',
      validation: [],
      enumOptions: [],
      maxFileSize: 5,
      acceptedFileTypes: ['image/*']
    }
  )

  const [enumOption, setEnumOption] = useState('')
  const [validationRule, setValidationRule] = useState({ type: 'pattern', value: '', message: '' })

  const handleSave = () => {
    if (!formData.name.trim()) return
    
    // Check for duplicate names
    if (existingFieldNames.includes(formData.name) && formData.name !== field?.name) {
      alert('Field name already exists')
      return
    }

    onSave(formData)
  }

  const addEnumOption = () => {
    if (enumOption.trim() && !formData.enumOptions?.includes(enumOption)) {
      setFormData(prev => ({
        ...prev,
        enumOptions: [...(prev.enumOptions || []), enumOption.trim()]
      }))
      setEnumOption('')
    }
  }

  const removeEnumOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      enumOptions: prev.enumOptions?.filter(o => o !== option) || []
    }))
  }

  const addValidationRule = () => {
    if (validationRule.value.trim()) {
      setFormData(prev => ({
        ...prev,
        validation: [...(prev.validation || []), {
          type: validationRule.type as ValidationRule['type'],
          value: validationRule.type.includes('Length') || validationRule.type === 'min' || validationRule.type === 'max' 
            ? Number(validationRule.value) 
            : validationRule.value,
          message: validationRule.message.trim() || undefined
        }]
      }))
      setValidationRule({ type: 'pattern', value: '', message: '' })
    }
  }

  const removeValidationRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      validation: prev.validation?.filter((_, i) => i !== index) || []
    }))
  }

  const selectedFieldType = FIELD_TYPES.find(t => t.value === formData.type)

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="!max-w-none !w-[540px] !gap-0 flex flex-col p-0">
        <SheetHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            {selectedFieldType?.icon}
            {field ? 'Edit Field' : 'Add New Field'}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 py-4 space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="field-name" className="text-sm font-medium">Field Name</Label>
                  <Input
                    id="field-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="field_name"
                    className="font-mono h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-type" className="text-sm font-medium">Field Type</Label>
                  <Select value={formData.type} onValueChange={(value: FieldType) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">({type.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="field-description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Field description..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* Field Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Field Options</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={formData.isRequired}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isRequired: checked }))
                      }
                    />
                    <Label htmlFor="required" className="text-xs font-medium">Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="unique"
                      checked={formData.isUnique}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isUnique: checked }))
                      }
                    />
                    <Label htmlFor="unique" className="text-xs font-medium">Unique</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="primary"
                      checked={formData.isPrimary}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isPrimary: checked }))
                      }
                    />
                    <Label htmlFor="primary" className="text-xs font-medium">Primary Key</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="index"
                      checked={formData.hasIndex}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, hasIndex: checked }))
                      }
                    />
                    <Label htmlFor="index" className="text-xs font-medium">Add Index</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Type-specific Configuration */}
              {formData.type === 'Enum' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Enum Options</h3>
                  
                  <div className="flex gap-2">
                    <Input
                      value={enumOption}
                      onChange={(e) => setEnumOption(e.target.value)}
                      placeholder="Add option..."
                      onKeyPress={(e) => e.key === 'Enter' && addEnumOption()}
                      className="h-8"
                    />
                    <Button onClick={addEnumOption} size="sm" className="h-8">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.enumOptions?.map((option) => (
                      <Badge key={option} variant="secondary" className="flex items-center gap-1">
                        {option}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeEnumOption(option)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.type === 'File' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">File Configuration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-size" className="text-sm font-medium">Max File Size (MB)</Label>
                    <Input
                      id="max-size"
                      type="number"
                      value={formData.maxFileSize || 5}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxFileSize: Number(e.target.value) 
                      }))}
                      min={1}
                      max={100}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-types" className="text-sm font-medium">Accepted File Types</Label>
                    <Input
                      id="file-types"
                      value={formData.acceptedFileTypes?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        acceptedFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="image/*, .pdf, .docx"
                      className="h-9"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Validation Rules */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Validation Rules</h3>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select 
                      value={validationRule.type} 
                      onValueChange={(value) => setValidationRule(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pattern">Pattern</SelectItem>
                        <SelectItem value="min">Min Value</SelectItem>
                        <SelectItem value="max">Max Value</SelectItem>
                        <SelectItem value="minLength">Min Length</SelectItem>
                        <SelectItem value="maxLength">Max Length</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={validationRule.value}
                      onChange={(e) => setValidationRule(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Value..."
                      className="flex-1 h-8 text-xs"
                    />
                    
                    <Button onClick={addValidationRule} size="sm" className="h-8 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Input
                    value={validationRule.message}
                    onChange={(e) => setValidationRule(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Error message (optional)"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  {formData.validation?.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{rule.type}:</span> {rule.value}
                        {rule.message && <span className="text-gray-500 ml-2">"{rule.message}"</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeValidationRule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Value */}
              {!formData.isPrimary && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Default Value</h3>
                    
                    {formData.type === 'Boolean' ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.defaultValue === true}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, defaultValue: checked }))
                          }
                        />
                        <Label className="text-sm">Default to true</Label>
                      </div>
                    ) : formData.type === 'Enum' ? (
                      <Select 
                        value={formData.defaultValue || ''} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, defaultValue: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default..." />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.enumOptions?.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.defaultValue || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                        placeholder="Default value..."
                        className="h-9"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Actions - Fixed Bottom */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-background flex-shrink-0">
          <Button variant="outline" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()} size="sm">
            {field ? 'Update Field' : 'Add Field'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}