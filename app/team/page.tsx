"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Shield, 
  User, 
  Mail,
  Calendar,
  Activity,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Owner',
    avatar: null,
    status: 'active',
    lastActive: new Date('2024-01-17T10:30:00Z'),
    joinedAt: new Date('2023-06-15T09:00:00Z'),
    projects: 8,
    permissions: ['admin', 'deploy', 'invite', 'billing']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'Admin',
    avatar: null,
    status: 'active',
    lastActive: new Date('2024-01-17T09:15:00Z'),
    joinedAt: new Date('2023-08-22T14:30:00Z'),
    projects: 6,
    permissions: ['admin', 'deploy', 'invite']
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@company.com',
    role: 'Developer',
    avatar: null,
    status: 'active',
    lastActive: new Date('2024-01-17T08:45:00Z'),
    joinedAt: new Date('2023-11-10T11:20:00Z'),
    projects: 4,
    permissions: ['deploy']
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@company.com',
    role: 'Developer',
    avatar: null,
    status: 'inactive',
    lastActive: new Date('2024-01-15T16:22:00Z'),
    joinedAt: new Date('2023-12-05T10:15:00Z'),
    projects: 3,
    permissions: ['deploy']
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@company.com',
    role: 'Viewer',
    avatar: null,
    status: 'active',
    lastActive: new Date('2024-01-17T07:30:00Z'),
    joinedAt: new Date('2024-01-08T13:45:00Z'),
    projects: 2,
    permissions: []
  }
]

const invitations = [
  {
    id: '1',
    email: 'new-dev@company.com',
    role: 'Developer',
    invitedBy: 'John Doe',
    invitedAt: new Date('2024-01-16T14:20:00Z'),
    status: 'pending'
  },
  {
    id: '2',
    email: 'designer@company.com',
    role: 'Viewer',
    invitedBy: 'Jane Smith',
    invitedAt: new Date('2024-01-15T11:30:00Z'),
    status: 'pending'
  }
]

const activityLog = [
  {
    id: '1',
    user: 'John Doe',
    action: 'updated permissions for Jane Smith',
    timestamp: new Date('2024-01-17T09:30:00Z'),
    type: 'permission_change'
  },
  {
    id: '2',
    user: 'Jane Smith',
    action: 'invited new-dev@company.com as Developer',
    timestamp: new Date('2024-01-16T14:20:00Z'),
    type: 'invitation_sent'
  },
  {
    id: '3',
    user: 'Mike Johnson',
    action: 'deployed E-commerce API to production',
    timestamp: new Date('2024-01-16T11:45:00Z'),
    type: 'deployment'
  },
  {
    id: '4',
    user: 'Alex Brown',
    action: 'joined the team',
    timestamp: new Date('2024-01-08T13:45:00Z'),
    type: 'member_joined'
  }
]

export default function TeamPage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Viewer')

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'Admin': return <Shield className="w-4 h-4 text-blue-600" />
      case 'Developer': return <User className="w-4 h-4 text-green-600" />
      case 'Viewer': return <Eye className="w-4 h-4 text-gray-600" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Developer': return 'bg-green-100 text-green-800 border-green-200'
      case 'Viewer': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'inactive': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return
    // Handle invitation logic here
    console.log('Inviting:', inviteEmail, 'as', inviteRole)
    setInviteEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Team Settings
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-blue-600">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-green-600">
                    {teamMembers.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-orange-600">{invitations.length}</p>
                </div>
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Users</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {teamMembers.filter(m => m.role === 'Owner' || m.role === 'Admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="w-4 h-4" />
              Invitations ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Invite New Member */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Invite New Member
                </CardTitle>
                <CardDescription>Send an invitation to join your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInviteMember} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team members and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{member.name}</h3>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                          </div>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{member.projects} projects</span>
                            <span>Last active {formatDistanceToNow(member.lastActive, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={`text-xs mb-1 ${getRoleBadgeColor(member.role)}`}>
                            <span className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </span>
                          </Badge>
                          <p className="text-xs text-gray-500">
                            Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Manage sent invitations and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                    <p className="text-gray-500">All invitations have been accepted or you haven't sent any yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{invitation.email}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>Role: {invitation.role}</span>
                            <span>Invited by {invitation.invitedBy}</span>
                            <span>{formatDistanceToNow(invitation.invitedAt, { addSuffix: true })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {invitation.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Resend
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
                <CardDescription>Recent team actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}