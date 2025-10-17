"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Key, 
  Trash2, 
  Save,
  Plus,
  Github,
  Chrome,
  Slack,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <EnterpriseDashboardLayout
      title="Settings"
      description="Manage your account and application preferences"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
      ]}
    >
      <div className="space-y-8">

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Database className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Key className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline">Change Avatar</Button>
                    <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size of 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.firstName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.lastName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.emailAddresses[0]?.emailAddress || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user?.username || ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications about your projects</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Updates</Label>
                    <p className="text-sm text-gray-500">Receive email updates about new features</p>
                  </div>
                  <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Email Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly summary</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Enabled via authenticator app</p>
                      </div>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                      </div>
                    </div>
                    <Button variant="outline">Change</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">API Keys</p>
                        <p className="text-sm text-gray-500">Manage your API access keys</p>
                      </div>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Active Sessions</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Chrome className="w-5 h-5" />
                        <div>
                          <p className="font-medium text-sm">Chrome on Windows</p>
                          <p className="text-xs text-gray-500">Current session • New York, US</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>Manage your third-party integrations and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Github className="w-6 h-6" />
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-gray-500">Deploy directly to GitHub repositories</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Connect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Slack className="w-6 h-6" />
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-gray-500">Get deployment notifications in Slack</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Connect external services to enhance your development workflow and receive notifications.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Editor Theme</Label>
                  <Select defaultValue="github">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Light</SelectItem>
                      <SelectItem value="dracula">Dracula</SelectItem>
                      <SelectItem value="monokai">Monokai</SelectItem>
                      <SelectItem value="solarized">Solarized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Font Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-save</Label>
                    <p className="text-sm text-gray-500">Automatically save changes as you work</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Pro Plan</h3>
                      <p className="text-sm text-gray-600">$29/month • Billed monthly</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Next billing date: January 15, 2025
                  </p>
                  <Button variant="outline">Manage Subscription</Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription will automatically renew. Cancel anytime from your billing settings.
                  </AlertDescription>
                </Alert>

                <Separator />

                <div className="space-y-4">
                  <Label>Usage This Month</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-600">API Calls</p>
                      <p className="text-lg font-semibold">2.4M / 5M</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '48%'}}></div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-600">Projects</p>
                      <p className="text-lg font-semibold">8 / 20</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-600">Storage</p>
                      <p className="text-lg font-semibold">12GB / 50GB</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '24%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Deleting your account is permanent and cannot be undone. All your projects and data will be lost.
                    </AlertDescription>
                  </Alert>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseDashboardLayout>
  )
}